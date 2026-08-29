import { initializeObserver } from './youtubeObserver';
import { setDebugMode } from './uiModifier';
import { UserProfile } from '../types';

/**
 * FocusTube — Content Script Entry Point
 *
 * Initializes the filtering pipeline on YouTube pages.
 * Loaded via manifest.json content_scripts at document_idle.
 */

/** Hardcoded development profile (fallback). */
const DEFAULT_PROFILE: UserProfile = {
  goals: ['software engineering', 'programming'],
  blockedCategories: ['entertainment', 'celebrity', 'drama', 'reaction', 'gaming'],
  blockShorts: true,
};

async function initialize(): Promise<void> {
  console.log('[FocusTube] Content script loaded on', window.location.href);

  // ① Load debug config
  try {
    const debugConfig = await chrome.runtime.sendMessage({ type: 'GET_DEBUG' });
    if (debugConfig) {
      setDebugMode(debugConfig.enabled);
    }
  } catch {
    setDebugMode(true);
  }

  // ② Load user profile and Focus Mode
  let profile: UserProfile;
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
    profile = response?.profile || DEFAULT_PROFILE;
    
    const focusRes = await chrome.runtime.sendMessage({ type: 'GET_FOCUS_MODE' });
    if (focusRes?.state?.active) {
      profile.blockShorts = true;
      profile.blockedDisplayMode = 'hide';
      profile.goals = [focusRes.state.topic];
    }
  } catch {
    profile = DEFAULT_PROFILE;
  }

  // ③ Redirect /shorts/ URLs to /watch?v= (before observer starts)
  if (profile.blockShorts) {
    redirectShortsUrl();
  }

  // ④ Start the observer
  if (document.body) {
    initializeObserver(profile);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      initializeObserver(profile);
    });
  }

  // ⑤ Listen for runtime messages (e.g., debug toggle)
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'DEBUG_CHANGED') {
      setDebugMode(message.enabled);
    }
  });

  // ⑥ Listen for YouTube SPA navigation to /shorts/ pages
  if (profile.blockShorts) {
    document.addEventListener('yt-navigate-finish', () => {
      redirectShortsUrl();
    });
  }
}

/**
 * If the current URL is a /shorts/VIDEO_ID page, redirect to /watch?v=VIDEO_ID.
 * This converts Shorts into regular video players.
 */
function redirectShortsUrl(): void {
  const url = window.location.href;
  const match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const videoId = match[1];
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[FocusTube] Redirecting Short to regular player: ${watchUrl}`);
    window.location.replace(watchUrl);
  }
}

initialize().catch(err => {
  console.error('[FocusTube] Failed to initialize:', err);
});
