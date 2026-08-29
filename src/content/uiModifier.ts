import { FilterResult, VideoMetadata, UserProfile } from '../types';

/** CSS class prefix to identify our modifications */
const PREFIX = 'focustube';

/** Track original display values for reversal */
const originalDisplays = new WeakMap<HTMLElement, string>();

/** Whether debug mode is active */
let debugMode = true; // ON by default for development

// ────────────────────────────────────────────
// Debug mode control
// ────────────────────────────────────────────

/** Set debug mode on/off. */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

/** Get current debug mode state. */
export function isDebugMode(): boolean {
  return debugMode;
}

// ────────────────────────────────────────────
// Style injection
// ────────────────────────────────────────────

/**
 * Inject the FocusTube CSS styles into the page.
 * Called once when the content script initializes.
 */
export function injectStyles(): void {
  if (document.getElementById(`${PREFIX}-styles`)) return;

  const style = document.createElement('style');
  style.id = `${PREFIX}-styles`;
  style.textContent = `
    .${PREFIX}-blocked {
      display: none !important;
      pointer-events: none !important;
    }

    .${PREFIX}-debug-blocked {
      position: relative;
      opacity: 0.3;
      outline: 2px solid #ff4444 !important;
      outline-offset: -2px;
      border-radius: 8px;
      overflow: visible;
      pointer-events: none !important;
    }

    .${PREFIX}-uncertain {
      position: relative;
      opacity: 0.7;
      outline: 2px solid #ffaa00 !important;
      outline-offset: -2px;
      border-radius: 8px;
    }

    .${PREFIX}-badge {
      position: absolute;
      top: 4px;
      left: 4px;
      z-index: 9999;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.3;
      pointer-events: none;
      white-space: pre-line;
      max-width: 90%;
    }

    .${PREFIX}-badge--blocked {
      background: rgba(255, 68, 68, 0.95);
      color: white;
    }

    .${PREFIX}-badge--uncertain {
      background: rgba(255, 170, 0, 0.95);
      color: #1a1a1a;
    }

    .${PREFIX}-badge--allowed {
      background: rgba(68, 187, 68, 0.85);
      color: white;
    }

    /* Inline Confirm styles */
    .${PREFIX}-inline-confirm {
      position: absolute;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 16px;
      text-align: center;
      border-radius: inherit;
    }
    .${PREFIX}-inline-confirm p { font-size: 13px; margin: 0 0 12px; font-weight: 600; line-height: 1.4; color: #fff; }
    .${PREFIX}-inline-confirm label { font-size: 11px; display: flex; align-items: center; gap: 6px; margin-bottom: 12px; cursor: pointer; color: #ccc; }
    .${PREFIX}-inline-actions { display: flex; gap: 8px; }
    .${PREFIX}-inline-actions button { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px; }
    .${PREFIX}-btn-cancel { background: #334; color: #fff; }
    .${PREFIX}-btn-watch { background: #ffaa00; color: #000; }
  `;

  document.head.appendChild(style);
}

/**
 * Toggle a global CSS rule that hides ALL Shorts containers.
 * This catches lazily-loaded Shorts rows that the MutationObserver misses.
 * Targets both home page and search results page DOM structures.
 */
export function setShortsBlocking(enabled: boolean): void {
  const SHORTS_STYLE_ID = `${PREFIX}-shorts-global`;
  const existing = document.getElementById(SHORTS_STYLE_ID);

  if (enabled && !existing) {
    const style = document.createElement('style');
    style.id = SHORTS_STYLE_ID;
    style.textContent = `
      /* Global Shorts blocking — hides all known Shorts containers */

      /* Shorts shelves (home page and search) */
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
      ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),

      /* Individual Shorts items (old and new renderers) */
      ytd-reel-item-renderer,
      yt-shorts-lockup-view-model,

      /* Any video card containing a /shorts/ link */
      ytd-video-renderer:has(a[href*="/shorts/"]),
      ytd-grid-video-renderer:has(a[href*="/shorts/"]),
      ytd-rich-item-renderer:has(a[href*="/shorts/"]),
      ytd-compact-video-renderer:has(a[href*="/shorts/"]),

      /* Elements with Shorts-specific class names (newer YouTube UI) */
      [class*="shortsLockupViewModelHost"],

      /* Sidebar/navigation Shorts entry */
      ytd-guide-entry-renderer:has(a[title="Shorts"]),
      ytd-mini-guide-entry-renderer:has(a[title="Shorts"]) {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  } else if (!enabled && existing) {
    existing.remove();
  }
}

// ────────────────────────────────────────────
// DOM modification
// ────────────────────────────────────────────

/**
 * Apply a filter result to a video card element.
 */
export function applyFilterResult(video: VideoMetadata, result: FilterResult, profile: UserProfile): void {
  const el = video.element;

  // Store original display for reversal
  if (!originalDisplays.has(el)) {
    originalDisplays.set(el, el.style.display);
  }

  // Clean up any previous FocusTube modifications
  cleanElement(el);

  switch (result.action) {
    case 'block':
      applyBlock(el, result, video, profile);
      break;
    case 'uncertain':
      applyUncertain(el, result);
      break;
    case 'allow':
      if (debugMode) {
        applyAllowDebug(el, result);
      }
      break;
  }
}

/** Hide a blocked video card. */
function applyBlock(el: HTMLElement, result: FilterResult, video: VideoMetadata, profile: UserProfile): void {
  // Always fully remove YouTube Shorts, even in debug mode
  if (video.isShort) {
    el.classList.add(`${PREFIX}-blocked`);
    return;
  }

  const hideCompletely = profile.blockedDisplayMode === 'hide';

  if (!debugMode || hideCompletely) {
    el.classList.add(`${PREFIX}-blocked`);
  } else {
    el.classList.add(`${PREFIX}-debug-blocked`);
    const text = [
      'BLOCKED',
      `Reason: ${result.reason}`,
      result.source === 'ai'
        ? `Confidence: ${Math.round(result.confidence * 100)}%`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    addBadge(el, 'blocked', text);
  }
}

/** Dim an uncertain video card. */
function applyUncertain(el: HTMLElement, result: FilterResult): void {
  el.classList.add(`${PREFIX}-uncertain`);

  if (debugMode) {
    const text = result.explanation 
      ? `UNCERTAIN\n\n${result.explanation}` 
      : `UNCERTAIN\n${result.reason}`;
    addBadge(el, 'uncertain', text);
  }

  // Store explanation for inline confirm
  (el as any).__focustube_explanation = result.explanation || result.reason;
  (el as any).__focustube_categories = result.categories || [];

  // Intercept clicks
  el.addEventListener('click', handleUncertainClick, true);
}

/** Show debug badge on allowed videos (debug mode only). */
function applyAllowDebug(el: HTMLElement, result: FilterResult): void {
  addBadge(el, 'allowed', `ALLOWED\n${result.reason}`);
}

/** Add a debug badge to a video card. */
function addBadge(
  el: HTMLElement,
  type: 'blocked' | 'uncertain' | 'allowed',
  text: string
): void {
  const badge = document.createElement('div');
  badge.className = `${PREFIX}-badge ${PREFIX}-badge--${type}`;
  badge.textContent = text;
  badge.dataset.focustube = 'badge';

  // Ensure parent has positioning context for the absolute badge
  const computed = window.getComputedStyle(el);
  if (computed.position === 'static') {
    el.style.position = 'relative';
  }

  el.appendChild(badge);
}

/** Remove all FocusTube modifications from an element. */
function cleanElement(el: HTMLElement): void {
  el.classList.remove(
    `${PREFIX}-blocked`,
    `${PREFIX}-debug-blocked`,
    `${PREFIX}-uncertain`
  );

  // Remove badges
  el.querySelectorAll(`[data-focustube="badge"]`).forEach(badge =>
    badge.remove()
  );

  // Restore original display
  const original = originalDisplays.get(el);
  if (original !== undefined) {
    el.style.display = original;
  }
}

// ────────────────────────────────────────────
// Inline Confirmation Logic
// ────────────────────────────────────────────

async function handleUncertainClick(e: Event): Promise<void> {
  const target = e.currentTarget as HTMLElement;

  // Allow clicks inside the inline confirm to pass through
  if ((e.target as HTMLElement).closest(`.${PREFIX}-inline-confirm`)) {
    return;
  }

  // Find the video URL (if available)
  let videoUrl = '';
  const links = target.querySelectorAll('a#video-title-link, a#thumbnail, a.yt-simple-endpoint');
  for (const link of links) {
    if (link.hasAttribute('href')) {
      videoUrl = (link as HTMLAnchorElement).href;
      if (videoUrl.includes('/watch') || videoUrl.includes('/shorts')) {
        break;
      }
    }
  }

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
    const profile = response?.profile;
    
    // Default to true if missing
    const requireConfirm = profile?.requireUncertainConfirmation ?? true;

    if (!requireConfirm) {
      // Allow click
      return;
    }

    // Block the click
    e.preventDefault();
    e.stopPropagation();

    // Show inline confirm
    // We attach the explanation and categories to the element dataset so we can use them
    target.dataset.focustubeExplanation = e.currentTarget instanceof HTMLElement && (e.currentTarget as any).__focustube_explanation ? (e.currentTarget as any).__focustube_explanation : '';
    target.dataset.focustubeCategories = e.currentTarget instanceof HTMLElement && (e.currentTarget as any).__focustube_categories ? JSON.stringify((e.currentTarget as any).__focustube_categories) : '[]';
    
    // Also store the videoId for feedback
    let vidId = '';
    const metadataLink = target.querySelector('a#video-title-link, a#thumbnail') as HTMLAnchorElement;
    if (metadataLink && metadataLink.href) {
      const u = new URL(metadataLink.href, window.location.origin);
      vidId = u.searchParams.get('v') || '';
    }
    target.dataset.focustubeVideoId = vidId;

    showInlineConfirm(target, videoUrl, profile);
  } catch {
    // If error, just allow click to fail open
  }
}

function showInlineConfirm(target: HTMLElement, videoUrl: string, profile: any): void {
  // Prevent multiple inline confirms on the same element
  if (target.querySelector(`.${PREFIX}-inline-confirm`)) return;

  const overlay = document.createElement('div');
  overlay.className = `${PREFIX}-inline-confirm`;
  overlay.dataset.focustube = 'inline-confirm';

  const explanation = target.dataset.focustubeExplanation || 'Are you sure you want to watch this uncertain video?';
  const lines = explanation.split('\n').map(l => l.trim()).filter(Boolean);
  const formattedExplanation = lines.length > 1 
    ? lines.map((line, i) => `<p style="margin: 2px 0; font-size: ${i < lines.length - 1 ? '11px' : '13px'}; color: ${i < lines.length - 1 ? '#aaa' : '#fff'}">${line}</p>`).join('')
    : `<p>${explanation}</p>`;

  overlay.innerHTML = `
    <div style="margin-bottom: 12px;">${formattedExplanation}</div>
    <label>
      <input type="checkbox" id="${PREFIX}-dont-ask-${Date.now()}" />
      Don't ask again
    </label>
    <div class="${PREFIX}-inline-actions">
      <button class="${PREFIX}-btn-cancel">Cancel</button>
      <button class="${PREFIX}-btn-watch">Watch</button>
    </div>
  `;

  // Ensure parent has position relative if static
  const computed = window.getComputedStyle(target);
  if (computed.position === 'static') {
    target.style.position = 'relative';
  }

  target.appendChild(overlay);

  const btnCancel = overlay.querySelector(`.${PREFIX}-btn-cancel`) as HTMLButtonElement;
  const btnWatch = overlay.querySelector(`.${PREFIX}-btn-watch`) as HTMLButtonElement;
  const dontAskCheckbox = overlay.querySelector('input[type="checkbox"]') as HTMLInputElement;

  btnCancel.addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.remove();
  });

  btnWatch.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    if (dontAskCheckbox.checked && profile) {
      profile.requireUncertainConfirmation = false;
      await chrome.runtime.sendMessage({ type: 'UPDATE_PROFILE', profile });
    }

    // Record the user decision to allow
    try {
      const topics = JSON.parse(target.dataset.focustubeCategories || '[]');
      const videoId = target.dataset.focustubeVideoId || '';
      if (videoId && topics.length > 0) {
        chrome.runtime.sendMessage({
          type: 'RECORD_DECISION',
          videoId,
          topics,
          decision: 'allow'
        });
      }
    } catch (err) {
      console.warn('Failed to record decision', err);
    }

    overlay.remove();

    if (videoUrl) {
      window.location.href = videoUrl;
    }
  });
}

// ────────────────────────────────────────────
// Teardown
// ────────────────────────────────────────────

/**
 * Restore all modified elements to their original state.
 */
export function restoreAll(): void {
  document
    .querySelectorAll(`.${PREFIX}-blocked, .${PREFIX}-debug-blocked, .${PREFIX}-uncertain`)
    .forEach(el => {
      el.removeEventListener('click', handleUncertainClick, true);
      cleanElement(el as HTMLElement);
    });

  document
    .querySelectorAll(`[data-focustube="badge"], [data-focustube="inline-confirm"]`)
    .forEach(el => el.remove());
}
