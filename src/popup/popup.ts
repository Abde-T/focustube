/// <reference types="chrome" />

import { UserProfile } from '../types';
import { findSimilarTopics } from '../ai/embeddingService';
import { scoreTextAgainstTopics } from '../ai/topicEmbeddingCache';
import { getTopicWeights, resetPreferences } from '../storage/preferences';
import { getFocusState, setFocusState } from '../storage/focusMode';
import topicsData from '../data/topics.json';
import { PARENT_TOPICS, expandTopics, getChildTopics, isParentTopic, getParentTopic } from '../data/topicHierarchy';

/**
 * FocusTube — Popup Script
 *
 * Displays filter statistics and configuration options.
 */

const AVAILABLE_GOALS = topicsData.availableGoals;

const AVAILABLE_BLOCKED = topicsData.availableBlocked;

let currentProfile: UserProfile | null = null;

async function loadStats(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    if (response?.stats) {
      setText('stat-total', response.stats.totalProcessed);
      setText('stat-blocked', response.stats.blocked);
      setText('stat-allowed', response.stats.allowed);
      setText('stat-uncertain', response.stats.uncertain);
    }
  } catch (e) {
    console.warn('[FocusTube] Could not load stats:', e);
  }
}

async function loadDebugState(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_DEBUG' });
    const toggle = document.getElementById('debug-toggle') as HTMLInputElement;
    if (response) {
      toggle.checked = response.enabled;
    }
  } catch (e) {
    console.warn('[FocusTube] Could not load debug state:', e);
  }
}

function setupDebugToggle(): void {
  const toggle = document.getElementById('debug-toggle') as HTMLInputElement;
  toggle.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({
      type: 'TOGGLE_DEBUG',
      enabled: toggle.checked,
    });
  });
}

function setText(id: string, value: number): void {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

// ── Profile Configuration ──────────────────────

async function loadProfile(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
    if (response?.profile) {
      currentProfile = response.profile;
      renderProfileUI();
    }
  } catch (e) {
    console.warn('[FocusTube] Could not load profile:', e);
  }
}

function renderProfileUI(): void {
  if (!currentProfile) return;

  // Shorts toggle
  const shortsToggle = document.getElementById('shorts-toggle') as HTMLInputElement;
  shortsToggle.checked = currentProfile.blockShorts;
  shortsToggle.onchange = () => updateProfile({ blockShorts: shortsToggle.checked });

  // Blocked display mode
  const displayHide = document.getElementById('display-hide') as HTMLInputElement;
  const displayDim = document.getElementById('display-dim') as HTMLInputElement;
  if (currentProfile.blockedDisplayMode === 'hide') {
    displayHide.checked = true;
  } else {
    displayDim.checked = true;
  }
  displayHide.onchange = () => updateProfile({ blockedDisplayMode: 'hide' });
  displayDim.onchange = () => updateProfile({ blockedDisplayMode: 'dim' });

  // Relevance threshold
  const relevanceSlider = document.getElementById('relevance-threshold') as HTMLInputElement;
  const relevanceNumber = document.getElementById('relevance-threshold-number') as HTMLInputElement;
  const threshold = currentProfile.relevanceThreshold ?? 0.3; // Default to 30%
  const thresholdValue = Math.round(threshold * 100);
  relevanceSlider.value = thresholdValue.toString();
  relevanceNumber.value = thresholdValue.toString();
  
  relevanceSlider.oninput = () => {
    const value = parseInt(relevanceSlider.value, 10);
    relevanceNumber.value = value.toString();
  };
  relevanceSlider.onchange = () => {
    const value = parseInt(relevanceSlider.value, 10);
    updateProfile({ relevanceThreshold: value / 100 });
  };
  relevanceNumber.oninput = () => {
    const value = parseInt(relevanceNumber.value, 10);
    if (value >= 0 && value <= 100) {
      relevanceSlider.value = value.toString();
    }
  };
  relevanceNumber.onchange = () => {
    let value = parseInt(relevanceNumber.value, 10);
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    relevanceNumber.value = value.toString();
    relevanceSlider.value = value.toString();
    updateProfile({ relevanceThreshold: value / 100 });
  };

  // Goals - Show parent topics instead of all individual subtopics
  const goalsList = document.getElementById('goals-list')!;
  goalsList.innerHTML = '';
  
  // Get all parent topics for display
  const parentTopics = Object.entries(PARENT_TOPICS).map(([id, data]) => ({
    id,
    label: data.label,
  }));
  
  // Also include any custom goals that don't have a parent
  const customGoals = currentProfile.goals.filter(goal => !getParentTopic(goal));
  customGoals.forEach(customGoal => {
    if (!parentTopics.find(p => p.id === customGoal)) {
      const label = customGoal.charAt(0).toUpperCase() + customGoal.slice(1);
      parentTopics.push({ id: customGoal, label });
    }
  });

  parentTopics.forEach(parentTopic => {
    // Check if any child of this parent is in the user's goals
    const childTopics = isParentTopic(parentTopic.id) 
      ? getChildTopics(parentTopic.id) 
      : [parentTopic.id];
    
    const isChecked = childTopics.some(child => currentProfile!.goals.includes(child));
    
    goalsList.appendChild(createPill(parentTopic.id, parentTopic.label, isChecked, false, (checked) => {
      let newGoals: string[];
      
      if (checked) {
        // Add parent topic - expand to all children
        if (isParentTopic(parentTopic.id)) {
          newGoals = [...currentProfile!.goals, ...getChildTopics(parentTopic.id)];
        } else {
          newGoals = [...currentProfile!.goals, parentTopic.id];
        }
      } else {
        // Remove parent topic - remove all its children
        if (isParentTopic(parentTopic.id)) {
          const childrenToRemove = getChildTopics(parentTopic.id);
          newGoals = currentProfile!.goals.filter(g => !childrenToRemove.includes(g));
        } else {
          newGoals = currentProfile!.goals.filter(g => g !== parentTopic.id);
        }
      }
      
      // Remove duplicates
      newGoals = [...new Set(newGoals)];
      updateProfile({ goals: newGoals });
    }));
  });

  // Blocked - Show parent categories instead of all individual subcategories
  const blockedList = document.getElementById('blocked-list')!;
  blockedList.innerHTML = '';
  
  // Group blocked categories by parent (using a simple grouping for now)
  // For blocked categories, we'll keep them as-is since they're already grouped in topics.json
  AVAILABLE_BLOCKED.forEach(block => {
    const isChecked = currentProfile!.blockedCategories.includes(block.id);
    blockedList.appendChild(createPill(block.id, block.label, isChecked, true, (checked) => {
      const newBlocked = checked 
        ? [...currentProfile!.blockedCategories, block.id] 
        : currentProfile!.blockedCategories.filter(b => b !== block.id);
      updateProfile({ blockedCategories: newBlocked });
    }));
  });
}

function createPill(id: string, labelText: string, isActive: boolean, isDistraction: boolean, onClick: (active: boolean) => void): HTMLElement {
  const pill = document.createElement('div');
  pill.className = `pill ${isActive ? (isDistraction ? 'active-distraction' : 'active') : ''}`;
  pill.textContent = labelText;
  
  pill.onclick = () => {
    const willBeActive = !pill.classList.contains(isDistraction ? 'active-distraction' : 'active');
    onClick(willBeActive);
  };
  
  return pill;
}

async function updateProfile(changes: Partial<UserProfile>): Promise<void> {
  if (!currentProfile) return;
  
  currentProfile = { ...currentProfile, ...changes };
  
  try {
    await chrome.runtime.sendMessage({ type: 'UPDATE_PROFILE', profile: currentProfile });
  } catch (e) {
    console.warn('[FocusTube] Failed to update profile:', e);
  }
}

// ── Learned Preferences ────────────────────────

async function loadLearnedPreferences(): Promise<void> {
  const container = document.getElementById('learned-preferences');
  const btnReset = document.getElementById('btn-reset-prefs');
  if (!container || !btnReset) return;

  btnReset.onclick = async () => {
    await resetPreferences();
    loadLearnedPreferences();
  };

  try {
    const weights = await getTopicWeights();
    const entries = Object.entries(weights);
    
    if (entries.length === 0) {
      container.innerHTML = '<em>No preferences learned yet.</em>';
      return;
    }

    const likes = entries.filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]);
    const dislikes = entries.filter(([, w]) => w < 0).sort((a, b) => a[1] - b[1]);

    let html = '';
    if (likes.length > 0) {
      html += `<div style="margin-bottom: 8px;"><strong>Frequently Allowed:</strong><br/>`;
      html += likes.map(([t, w]) => `<span style="color: #86efac;">${t} (+${w.toFixed(1)})</span>`).join(', ');
      html += `</div>`;
    }
    if (dislikes.length > 0) {
      html += `<div><strong>Frequently Blocked/Ignored:</strong><br/>`;
      html += dislikes.map(([t, w]) => `<span style="color: #fca5a5;">${t} (${w.toFixed(1)})</span>`).join(', ');
      html += `</div>`;
    }

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<em>Error loading preferences.</em>';
  }
}

// ── AI Topic Generator ───────────────────────────

function setupAIGenerator(): void {
  const btn = document.getElementById('btn-analyze') as HTMLButtonElement;
  const input = document.getElementById('ai-prompt') as HTMLTextAreaElement;
  const spinner = document.getElementById('ai-spinner') as HTMLElement;
  const loadingText = document.getElementById('ai-loading-text') as HTMLElement;
  const icon = document.getElementById('ai-icon') as HTMLElement;

  btn.addEventListener('click', async () => {
    const prompt = input.value.trim();
    if (!prompt) return;

    btn.disabled = true;
    if (icon) icon.style.display = 'none';
    spinner.style.display = 'block';
    if (loadingText) loadingText.style.display = 'inline-block';

    try {
      // Use semantic topic profiles for better matching
      const topicIds = AVAILABLE_GOALS.map(g => g.id);
      const matches = await scoreTextAgainstTopics(prompt, topicIds);

      console.log('[FocusTube] Semantic matches:', matches);

      if (matches.length > 0 && currentProfile) {
        // Filter by relevance threshold (0.4 for user intent matching)
        const relevantMatches = matches.filter(m => m.score >= 0.4);
        
        if (relevantMatches.length === 0) {
          alert('Could not find closely matching topics. Try describing your goals differently.');
          return;
        }

        const matchedIds = relevantMatches.map(m => m.topic);
        const newGoals = Array.from(new Set([...currentProfile.goals, ...matchedIds]));
        await updateProfile({ goals: newGoals });
        input.value = '';
        renderProfileUI();
      } else {
        alert('Could not find closely matching topics. Try describing your goals differently.');
      }

    } catch (e) {
      console.error('AI Request failed:', e);
      alert('Error extracting topics.');
    } finally {
      btn.disabled = false;
      if (icon) icon.style.display = 'block';
      spinner.style.display = 'none';
      if (loadingText) loadingText.style.display = 'none';
    }
  });
}

// ── Focus Mode ──────────────────────────────────

let focusTimerInterval: number | null = null;

async function loadFocusMode(): Promise<void> {
  const state = await getFocusState();
  const inactiveUi = document.getElementById('focus-inactive-ui');
  const activeUi = document.getElementById('focus-active-ui');
  const topicSelect = document.getElementById('focus-topic-select') as HTMLSelectElement;
  const activeTopicDisplay = document.getElementById('focus-active-topic');
  
  if (!inactiveUi || !activeUi || !topicSelect || !activeTopicDisplay) return;

  // Populate goals if available
  if (currentProfile && currentProfile.goals.length > 0) {
    topicSelect.innerHTML = '<option value="">Select a topic...</option>' + 
      currentProfile.goals.map(g => `<option value="${g}">${g.charAt(0).toUpperCase() + g.slice(1)}</option>`).join('');
  }

  if (state.active) {
    inactiveUi.style.display = 'none';
    activeUi.style.display = 'block';
    activeTopicDisplay.textContent = state.topic;
    
    updateFocusTimer(state);
    if (focusTimerInterval) clearInterval(focusTimerInterval);
    focusTimerInterval = window.setInterval(() => updateFocusTimer(state), 1000) as unknown as number;
  } else {
    inactiveUi.style.display = 'block';
    activeUi.style.display = 'none';
    if (focusTimerInterval) clearInterval(focusTimerInterval);
  }
}

function updateFocusTimer(state: any) {
  const timeDisplay = document.getElementById('focus-time-remaining');
  if (!timeDisplay) return;
  
  if (state.durationMs === 0) {
    timeDisplay.textContent = 'Until disabled';
    return;
  }
  
  const now = Date.now();
  const end = state.startTime + state.durationMs;
  const remaining = Math.max(0, end - now);
  
  if (remaining === 0) {
    // expired
    loadFocusMode(); 
    return;
  }
  
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  timeDisplay.textContent = `Time remaining: ${m}m ${s}s`;
}

function setupFocusMode(): void {
  const btnStart = document.getElementById('btn-start-focus');
  const btnEnd = document.getElementById('btn-end-focus');
  const topicSelect = document.getElementById('focus-topic-select') as HTMLSelectElement;
  const durationSelect = document.getElementById('focus-duration-select') as HTMLSelectElement;
  
  if (btnStart && topicSelect && durationSelect) {
    btnStart.addEventListener('click', async () => {
      const topic = topicSelect.value;
      const durationMs = parseInt(durationSelect.value, 10);
      if (!topic) {
        alert('Please select a topic to focus on.');
        return;
      }
      
      const state = {
        active: true,
        topic,
        durationMs,
        startTime: Date.now()
      };
      
      await setFocusState(state);
      await chrome.runtime.sendMessage({ type: 'UPDATE_FOCUS_MODE', state });
      loadFocusMode();
    });
  }
  
  if (btnEnd) {
    btnEnd.addEventListener('click', async () => {
      const state = { active: false, topic: '', durationMs: 0, startTime: 0 };
      await setFocusState(state);
      await chrome.runtime.sendMessage({ type: 'UPDATE_FOCUS_MODE', state });
      loadFocusMode();
    });
  }
}

// ── Initialize ──────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Setup tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      const target = (e.currentTarget as HTMLElement).dataset.target;
      (e.currentTarget as HTMLElement).classList.add('active');
      document.getElementById(target!)?.classList.add('active');
    });
  });

  loadStats();
  loadDebugState();
  await loadProfile();
  loadLearnedPreferences();
  loadFocusMode();
  setupFocusMode();
  setupDebugToggle();
  setupAIGenerator();

  // Refresh stats every 2 seconds while popup is open
  setInterval(loadStats, 2000);
});
