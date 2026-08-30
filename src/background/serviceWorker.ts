import { createClassificationService } from '../ai/classificationService';
import { initializePipeline } from '../ai/embeddingService';
import {
  getCachedClassification,
  cacheClassification,
  getProfile,
  saveProfile,
  getProfileVersion,
  getStats,
  incrementStat,
  getDebugConfig,
  saveDebugConfig,
} from '../storage/storage';
import { recordDecision } from '../storage/preferences';
import { getFocusState, setFocusState } from '../storage/focusMode';

/**
 * FocusTube — Background Service Worker
 *
 * Responsibilities:
 *   • Handle classification requests from the content script
 *   • Manage the classification cache
 *   • Serve profile and config data
 *   • Track filter statistics
 */

const classifier = createClassificationService();

// Initialize the embedding model in the background on startup
// This pre-loads the model so it's ready when needed
initializePipeline();

// ────────────────────────────────────────────
// Message handling
// ────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'CLASSIFY_VIDEO':
      handleClassification(message)
        .then(sendResponse)
        .catch(err => {
          console.error('[FocusTube] Classification error:', err);
          sendResponse({
            result: {
              action: 'allow',
              categories: ['error'],
              relevance: 0,
              confidence: 0,
              reason: 'Classification failed — showing video by default',
            },
            cached: false,
          });
        });
      return true; // Keep message channel open for async response

    case 'GET_PROFILE':
      getProfile().then(profile => sendResponse({ profile }));
      return true;

    case 'UPDATE_PROFILE':
      saveProfile(message.profile).then(async () => {
        // Broadcast profile change to all tabs
        try {
          const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'PROFILE_CHANGED' }).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('Failed to broadcast profile change', e);
        }
        sendResponse({ success: true });
      });
      return true;

    case 'GET_STATS':
      getStats().then(stats => sendResponse({ stats }));
      return true;

    case 'GET_DEBUG':
      getDebugConfig().then(config => sendResponse(config));
      return true;

    case 'TOGGLE_DEBUG':
      handleToggleDebug(message.enabled, sendResponse);
      return true;

    case 'UPDATE_STATS':
      handleUpdateStats(message.action);
      return false; // No response needed

    case 'GET_FOCUS_MODE':
      getFocusState().then(state => sendResponse({ state }));
      return true;

    case 'UPDATE_FOCUS_MODE':
      setFocusState(message.state).then(() => {
        // Send notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          title: 'FocusTube',
          message: message.state.active 
            ? `Focus Mode activated: ${message.state.topic}` 
            : 'Focus Mode ended. Normal filtering restored.'
        });

        // Broadcast profile update so content scripts re-scan based on focus mode
        chrome.storage.local.get('focustube_profile').then(async data => {
          try {
            const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
            for (const tab of tabs) {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { 
                  type: 'PROFILE_CHANGED', 
                  profile: data.focustube_profile 
                }).catch(() => {});
              }
            }
          } catch (e) {
            console.warn('Failed to broadcast profile change', e);
          }
        });
        sendResponse({ success: true });
      });
      return true;

    case 'RECORD_DECISION':
      recordDecision(message.videoId, message.topics, message.decision)
        .then(() => sendResponse({ success: true }));
      return true;

    default:
      return false;
  }
});

// ────────────────────────────────────────────
// Classification
// ────────────────────────────────────────────

async function handleClassification(
  message: any
): Promise<{ result: any; cached: boolean }> {
  const { video, userProfile } = message;
  const profileVersion = getProfileVersion(userProfile);

  // Check cache first (agent.md §10)
  const cached = await getCachedClassification(video.videoId, profileVersion);
  if (cached) {
    return { result: cached, cached: true };
  }

  // Run classification
  const result = await classifier.classifyVideo(video, userProfile);

  // Cache the result
  await cacheClassification(video.videoId, profileVersion, result);

  return { result, cached: false };
}

// ────────────────────────────────────────────
// Debug toggle
// ────────────────────────────────────────────

function handleToggleDebug(
  enabled: boolean,
  sendResponse: (response: any) => void
): void {
  saveDebugConfig({ enabled }).then(() => {
    // Notify all YouTube tabs
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, tabs => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'DEBUG_CHANGED',
            enabled,
          });
        }
      });
    });
    sendResponse({ success: true });
  });
}

// ────────────────────────────────────────────
// Stats
// ────────────────────────────────────────────

function handleUpdateStats(action: string): void {
  incrementStat('totalProcessed');
  if (action === 'block') incrementStat('blocked');
  else if (action === 'allow') incrementStat('allowed');
  else if (action === 'uncertain') incrementStat('uncertain');
}
