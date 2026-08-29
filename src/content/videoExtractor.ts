import { VideoMetadata } from '../types';

/**
 * YouTube DOM selectors — isolated here so they can be updated
 * independently when YouTube changes its DOM structure.
 * (agent.md §17.8: "Keep YouTube-specific DOM selectors isolated in one module")
 */
const SELECTORS = {
  // Video card containers
  videoCards: [
    'ytd-rich-item-renderer',       // Home page grid items
    'ytd-video-renderer',           // Search results
    'ytd-compact-video-renderer',   // Sidebar recommendations
    'ytd-grid-video-renderer',      // Channel page grid
  ],

  // Shorts-specific containers
  shortsCards: [
    'ytd-rich-section-renderer',    // Shorts shelf section on home
    'ytd-reel-shelf-renderer',      // Shorts shelf on home
    'ytd-reel-item-renderer',       // Individual short in shelf
  ],

  // Metadata selectors within a video card
  title: [
    '#video-title',
    'a#video-title-link',
    'span#video-title',
    'h3 a',
  ],

  channel: [
    '#channel-name a',
    'ytd-channel-name a',
    '#channel-name #text',
    '.ytd-channel-name a',
    'yt-formatted-string#text',
  ],

  description: [
    '#description-text',
    'ytd-text-inline-expander yt-attributed-string',
    '#description-inner yt-attributed-string',
    'ytd-video-secondary-info-renderer #description',
  ],

  link: [
    'a#video-title-link',
    'a#thumbnail',
    'h3 a',
    'a.yt-simple-endpoint',
  ],
} as const;

/**
 * Combined CSS selector for all video card types.
 * Used by the MutationObserver to know what to watch for.
 */
export const ALL_VIDEO_CARD_SELECTORS = [
  ...SELECTORS.videoCards,
  ...SELECTORS.shortsCards,
].join(', ');

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

/**
 * Extract a video ID from a YouTube URL.
 */
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);

    // Standard watch URL: /watch?v=VIDEO_ID
    const vParam = urlObj.searchParams.get('v');
    if (vParam) return vParam;

    // Shorts URL: /shorts/VIDEO_ID
    const shortsMatch = urlObj.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) return shortsMatch[1];

    // Embed URL: /embed/VIDEO_ID
    const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Query for the first matching element from a list of selectors.
 */
function queryFirst(parent: HTMLElement, selectors: readonly string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = parent.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}

/**
 * Determine if a video card represents a YouTube Short.
 */
function isShortElement(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase();

  // Check if the element itself is a shorts container
  if (SELECTORS.shortsCards.some(sel => tag === sel || element.matches(sel))) {
    return true;
  }

  // Check if any link inside points to /shorts/
  const links = element.querySelectorAll<HTMLAnchorElement>('a[href]');
  for (const link of links) {
    const href = link.href || link.getAttribute('href') || '';
    if (href.includes('/shorts/')) return true;
  }

  return false;
}

// ────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────

/**
 * Extract video metadata from a YouTube video card DOM element.
 * Returns null if essential metadata cannot be extracted.
 */
export function extractVideoMetadata(element: HTMLElement): VideoMetadata | null {
  const isShort = isShortElement(element);

  // Extract title
  const titleEl = queryFirst(element, SELECTORS.title);
  const title =
    titleEl?.textContent?.trim() ||
    titleEl?.getAttribute('title')?.trim() ||
    '';

  // Extract channel name
  const channelEl = queryFirst(element, SELECTORS.channel);
  const channel = channelEl?.textContent?.trim() || '';

  // Extract description (if available - typically only on video pages, not cards)
  const descriptionEl = queryFirst(element, SELECTORS.description);
  const description = descriptionEl?.textContent?.trim() || '';

  // Extract URL and video ID
  const linkEl = queryFirst(element, SELECTORS.link);
  const href = linkEl?.getAttribute('href') || '';
  const fullUrl = href ? new URL(href, window.location.origin).href : '';
  const videoId = extractVideoId(fullUrl);

  // For shorts shelves without individual video data,
  // generate a synthetic ID so we can still process them.
  if (isShort && !videoId) {
    return {
      videoId: `shorts-shelf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: title || 'Shorts Shelf',
      channel: channel || 'YouTube Shorts',
      url: fullUrl || window.location.href,
      isShort: true,
      element,
    };
  }

  // Must have at least a video ID and title for regular videos
  if (!videoId || !title) {
    return null;
  }

  return {
    videoId,
    title,
    channel,
    description,
    url: fullUrl,
    isShort,
    element,
  };
}

/**
 * Check if an element is a recognized video card type.
 */
export function isVideoCard(element: HTMLElement): boolean {
  return element.matches(ALL_VIDEO_CARD_SELECTORS);
}
