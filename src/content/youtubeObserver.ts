import {
  VideoMetadata,
  FilterResult,
  UserProfile,
  SerializableVideoMetadata,
} from '../types';
import {
  extractVideoMetadata,
  ALL_VIDEO_CARD_SELECTORS,
  isVideoCard,
} from './videoExtractor';
import { applyLocalFilters } from './videoFilter';
import { applyFilterResult, injectStyles, restoreAll, setShortsBlocking } from './uiModifier';

// ────────────────────────────────────────────
// State
// ────────────────────────────────────────────

/** Video IDs that have already been processed. */
const processedVideos = new Set<string>();

/** DOM elements that have been processed (avoids duplicates). */
let processedElements = new WeakSet<HTMLElement>();

/** Whether the observer is paused (prevents infinite loops from own DOM edits). */
let isPaused = false;

/** The MutationObserver instance. */
let observer: MutationObserver | null = null;

/** Batch processing timer handle. */
let batchTimer: number | null = null;

/** Elements waiting to be processed in the next batch. */
const pendingElements: HTMLElement[] = [];

/** The active user profile. */
let userProfile: UserProfile | null = null;

/** Map videoId → element for applying async classification results. */
const videoElementMap = new Map<string, HTMLElement>();

// ────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────

/**
 * Initialize the YouTube observer and start watching for video cards.
 */
export function initializeObserver(profile: UserProfile): void {
  userProfile = profile;

  injectStyles();
  setShortsBlocking(profile.blockShorts);
  processExistingCards();
  startObserver();
  listenForNavigation();
  listenForProfileChanges();

  console.log('[FocusTube] Observer initialized');
}

/**
 * Clean up the observer and all state.
 */
export function destroyObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (batchTimer !== null) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  processedVideos.clear();
  videoElementMap.clear();
  processedElements = new WeakSet();
  console.log('[FocusTube] Observer destroyed');
}

// ────────────────────────────────────────────
// Scanning
// ────────────────────────────────────────────

/** Scan for video cards already present in the DOM. */
function processExistingCards(): void {
  const cards =
    document.querySelectorAll<HTMLElement>(ALL_VIDEO_CARD_SELECTORS);
  cards.forEach(card => {
    if (!processedElements.has(card)) {
      scheduleProcessing(card);
    }
  });
}

// ────────────────────────────────────────────
// Batching
// ────────────────────────────────────────────

/**
 * Schedule an element for batch processing.
 * Debounces to avoid work during rapid DOM updates.
 */
function scheduleProcessing(element: HTMLElement): void {
  if (processedElements.has(element)) return;

  pendingElements.push(element);

  if (batchTimer !== null) {
    clearTimeout(batchTimer);
  }

  batchTimer = window.setTimeout(() => {
    processBatch();
    batchTimer = null;
  }, 100); // 100 ms debounce
}

/** Process all pending elements in one batch. */
function processBatch(): void {
  if (!userProfile) return;

  const elements = pendingElements.splice(0);

  // Pause observer during our own DOM modifications
  isPaused = true;

  for (const element of elements) {
    if (processedElements.has(element)) continue;
    processVideoCard(element);
  }

  isPaused = false;
}

// ────────────────────────────────────────────
// Pipeline (per video card)
// ────────────────────────────────────────────

/**
 * Process a single video card through the filtering pipeline:
 * extract → local filter → (async) AI classification → UI action
 */
function processVideoCard(element: HTMLElement): void {
  if (!userProfile) return;

  // Mark as processed immediately to prevent duplicates
  processedElements.add(element);

  // ① Extract metadata
  const metadata = extractVideoMetadata(element);
  if (!metadata) return; // Couldn't extract — skip silently

  // Skip if this video ID was already fully processed
  if (processedVideos.has(metadata.videoId)) return;
  processedVideos.add(metadata.videoId);

  // Keep a reference for async classification callbacks
  videoElementMap.set(metadata.videoId, element);

  // ② Apply deterministic local filters
  const localResult = applyLocalFilters(metadata, userProfile);

  if (localResult.action !== 'uncertain') {
    // Definitive local decision — apply immediately
    applyFilterResult(metadata, localResult, userProfile);
    logResult(metadata, localResult);
    sendStatUpdate(localResult.action);
    return;
  }

  // ③ Needs AI classification — send to background
  requestClassification(metadata);
}

// ────────────────────────────────────────────
// AI classification (via background)
// ────────────────────────────────────────────

/** Send a video to the background service worker for classification. */
function requestClassification(video: VideoMetadata): void {
  const serializable: SerializableVideoMetadata = {
    videoId: video.videoId,
    title: video.title,
    channel: video.channel,
    description: video.description,
    url: video.url,
    isShort: video.isShort,
  };

  chrome.runtime.sendMessage(
    {
      type: 'CLASSIFY_VIDEO',
      video: serializable,
      userProfile: userProfile,
    },
    response => {
      if (chrome.runtime.lastError) {
        console.warn(
          '[FocusTube] Classification request failed:',
          chrome.runtime.lastError.message
        );
        // Fail open — don't block the video (agent.md §17.2)
        return;
      }

      if (response?.result) {
        handleClassificationResponse(video, response);
      }
    }
  );
}

/** Apply the classification result received from the background. */
function handleClassificationResponse(
  video: VideoMetadata,
  response: { result: any; cached: boolean }
): void {
  const result: FilterResult = {
    action: response.result.action,
    reason: response.result.reason,
    confidence: response.result.confidence,
    source: response.cached ? 'cache' : 'ai',
    categories: response.result.categories,
  };

  // Check if Focus Mode is active (read from the profile overrides)
  const isFocusMode = userProfile?.goals?.length === 1 && userProfile?.blockedDisplayMode === 'hide';

  if (isFocusMode) {
    // In Focus Mode: block anything that isn't explicitly allowed
    if (result.action === 'uncertain') {
      result.action = 'block';
      result.reason = `Focus Mode: ${result.reason}`;
    }
  }

  // Pause observer during DOM modification
  isPaused = true;
  applyFilterResult(video, result, userProfile!);
  isPaused = false;

  logResult(video, result);
  sendStatUpdate(result.action);
}

// ────────────────────────────────────────────
// MutationObserver
// ────────────────────────────────────────────

/** Start observing the DOM for new video cards. */
function startObserver(): void {
  if (observer) observer.disconnect();

  observer = new MutationObserver(mutations => {
    if (isPaused) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        // Is the added node itself a video card?
        if (isVideoCard(node) && !processedElements.has(node)) {
          scheduleProcessing(node);
          continue;
        }

        // Does it contain video cards?
        const cards =
          node.querySelectorAll<HTMLElement>(ALL_VIDEO_CARD_SELECTORS);
        cards.forEach(card => {
          if (!processedElements.has(card)) {
            scheduleProcessing(card);
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[FocusTube] MutationObserver started');
}

// ────────────────────────────────────────────
// SPA navigation & Message passing
// ────────────────────────────────────────────

/** Listen for YouTube SPA navigation events. */
function listenForNavigation(): void {
  document.addEventListener('yt-navigate-finish', () => {
    console.log('[FocusTube] SPA navigation detected — rescanning');
    setTimeout(processExistingCards, 500);
  });
}

/** Listen for profile changes from the popup/background. */
function listenForProfileChanges(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROFILE_CHANGED') {
      console.log('[FocusTube] Profile changed — re-evaluating videos');
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (response) => {
        if (response?.profile) {
          const profile = response.profile;
          
          chrome.runtime.sendMessage({ type: 'GET_FOCUS_MODE' }, (focusRes) => {
            if (focusRes?.state?.active) {
              profile.blockShorts = true;
              profile.blockedDisplayMode = 'hide';
              profile.goals = [focusRes.state.topic];
            }
            
            userProfile = profile;
            
            // Update global Shorts blocking
            setShortsBlocking(profile.blockShorts);
            
            // Clear caches
            processedVideos.clear();
            processedElements = new WeakSet();
            videoElementMap.clear();
            
            // Reset UI
            restoreAll();
            
            // Re-scan
            processExistingCards();
          });
        }
      });
    }
  });
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

/** Log a filter result for debugging. */
function logResult(video: VideoMetadata, result: FilterResult): void {
  const icon =
    result.action === 'block'
      ? '🚫'
      : result.action === 'allow'
        ? '✅'
        : '❓';
  console.log(
    `[FocusTube] ${icon} ${result.action.toUpperCase()} | "${video.title}" | ${result.reason} | source: ${result.source}`
  );
}

/** Send a stat update to the background (fire-and-forget). */
function sendStatUpdate(action: string): void {
  chrome.runtime.sendMessage({ type: 'UPDATE_STATS', action }).catch(() => {
    // Stats are non-critical — ignore errors
  });
}
