/// <reference types="chrome" />

import {
  UserProfile,
  ClassificationResult,
  CacheEntry,
  FilterStats,
  DebugConfig,
} from '../types';

// ────────────────────────────────────────────
// Storage keys
// ────────────────────────────────────────────

const KEYS = {
  PROFILE: 'focustube_profile',
  CACHE: 'focustube_cache',
  STATS: 'focustube_stats',
  DEBUG: 'focustube_debug',
} as const;

// ────────────────────────────────────────────
// Defaults
// ────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  goals: ['software engineering', 'programming'],
  blockedCategories: [
    'entertainment',
    'celebrity',
    'drama',
    'reaction',
    'gaming',
  ],
  blockShorts: true,
  requireUncertainConfirmation: true,
  blockedDisplayMode: 'dim',
  relevanceThreshold: 0.35, // Default to 35% - blocks "Weak" and below
};

const DEFAULT_STATS: FilterStats = {
  totalProcessed: 0,
  blocked: 0,
  allowed: 0,
  uncertain: 0,
};

// ────────────────────────────────────────────
// Profile
// ────────────────────────────────────────────

/** Get the user profile from storage, or return the default. */
export async function getProfile(): Promise<UserProfile> {
  try {
    const result = await chrome.storage.local.get(KEYS.PROFILE);
    return result[KEYS.PROFILE] || DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

/** Save the user profile to storage. */
export async function saveProfile(profile: UserProfile): Promise<void> {
  await chrome.storage.local.set({ [KEYS.PROFILE]: profile });
}

// ────────────────────────────────────────────
// Classification cache
// ────────────────────────────────────────────

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Get a cached classification result for a video. */
export async function getCachedClassification(
  videoId: string,
  profileVersion: string
): Promise<ClassificationResult | null> {
  try {
    const result = await chrome.storage.local.get(KEYS.CACHE);
    const cache: Record<string, CacheEntry> = result[KEYS.CACHE] || {};
    const key = `${videoId}:${profileVersion}`;
    const entry = cache[key];

    if (!entry) return null;

    // Expire after 24 hours
    if (Date.now() - entry.timestamp > ONE_DAY_MS) {
      return null;
    }

    return entry.result;
  } catch {
    return null;
  }
}

/** Cache a classification result. */
export async function cacheClassification(
  videoId: string,
  profileVersion: string,
  result: ClassificationResult
): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(KEYS.CACHE);
    const cache: Record<string, CacheEntry> = stored[KEYS.CACHE] || {};
    const key = `${videoId}:${profileVersion}`;

    cache[key] = {
      result,
      timestamp: Date.now(),
      profileVersion,
    };

    await chrome.storage.local.set({ [KEYS.CACHE]: cache });
  } catch (e) {
    console.warn('[FocusTube] Failed to cache classification:', e);
  }
}

// ────────────────────────────────────────────
// Statistics
// ────────────────────────────────────────────

/** Get filter statistics. */
export async function getStats(): Promise<FilterStats> {
  try {
    const result = await chrome.storage.session.get(KEYS.STATS);
    return result[KEYS.STATS] || DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

/** Increment a specific stat counter. */
export async function incrementStat(
  key: keyof FilterStats
): Promise<void> {
  const stats = await getStats();
  stats[key]++;
  await chrome.storage.session.set({ [KEYS.STATS]: stats });
}

// ────────────────────────────────────────────
// Debug config
// ────────────────────────────────────────────

/** Get debug configuration. */
export async function getDebugConfig(): Promise<DebugConfig> {
  try {
    const result = await chrome.storage.local.get(KEYS.DEBUG);
    return result[KEYS.DEBUG] || { enabled: true }; // Debug ON by default
  } catch {
    return { enabled: true };
  }
}

/** Save debug configuration. */
export async function saveDebugConfig(config: DebugConfig): Promise<void> {
  await chrome.storage.local.set({ [KEYS.DEBUG]: config });
}

// ────────────────────────────────────────────
// Profile versioning
// ────────────────────────────────────────────

/**
 * Generate a simple profile version hash.
 * Used as part of the cache key so that changing the profile
 * invalidates stale classifications (agent.md §10).
 */
export function getProfileVersion(profile: UserProfile): string {
  const data = JSON.stringify({
    goals: [...profile.goals].sort(),
    blockedCategories: [...profile.blockedCategories].sort(),
    blockShorts: profile.blockShorts,
  });

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }

  return `v${Math.abs(hash).toString(36)}`;
}
