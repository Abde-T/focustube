/**
 * FocusTube — Core Type Definitions
 */

// ────────────────────────────────────────────
// Video Metadata
// ────────────────────────────────────────────

/** Metadata extracted from a YouTube video card DOM element. */
export interface VideoMetadata {
  /** YouTube video ID (e.g., "dQw4w9WgXcQ") */
  videoId: string;
  /** Video title */
  title: string;
  /** Channel name */
  channel: string;
  /** Video description (if available) */
  description?: string;
  /** Full URL to the video */
  url: string;
  /** Whether this is a YouTube Short */
  isShort: boolean;
  /** Reference to the DOM element for this video card */
  element: HTMLElement;
}

/** Video metadata without the DOM element reference (for message passing). */
export interface SerializableVideoMetadata {
  videoId: string;
  title: string;
  channel: string;
  description?: string;
  url: string;
  isShort: boolean;
}

// ────────────────────────────────────────────
// User Profile
// ────────────────────────────────────────────

/** User's filtering profile. */
export interface UserProfile {
  /** User's learning/content goals */
  goals: string[];
  /** Categories to block */
  blockedCategories: string[];
  /** Whether to block YouTube Shorts */
  blockShorts: boolean;
  /** Specific keywords to block */
  blockedKeywords?: string[];
  /** Channels to always block */
  blockedChannels?: string[];
  /** Channels to always allow (bypass filtering) */
  allowedChannels?: string[];
  /** Whether to show a confirmation dialog for uncertain videos */
  requireUncertainConfirmation?: boolean;
  /** How to display blocked videos */
  blockedDisplayMode?: 'hide' | 'dim';
  /** Minimum relevance threshold (0-1) for allowing videos */
  relevanceThreshold?: number;
}

// ────────────────────────────────────────────
// Focus Mode
// ────────────────────────────────────────────

/** Temporary Focus Mode state */
export interface FocusModeState {
  active: boolean;
  topic: string;
  durationMs: number;
  startTime: number;
}

// ────────────────────────────────────────────
// Filtering
// ────────────────────────────────────────────

/** Possible filter actions. */
export type FilterAction = 'allow' | 'block' | 'uncertain';

/** Source of the filtering decision. */
export type FilterSource = 'local' | 'ai' | 'cache';

/** Result of filtering a video. */
export interface FilterResult {
  /** The action to take */
  action: FilterAction;
  /** Human-readable reason for the decision */
  reason: string;
  /** Confidence level (0–1) */
  confidence: number;
  /** Where this decision came from */
  source: FilterSource;
  /** Categories identified */
  categories?: string[];
  /** Detailed human-readable explanation generated from scores */
  explanation?: string;
}

// ────────────────────────────────────────────
// AI Classification
// ────────────────────────────────────────────

/** Structured result returned by the classification service. */
export interface ClassificationResult {
  /** The recommended action */
  action: FilterAction;
  /** Content categories identified */
  categories: string[];
  /** Relevance score to user goals (0–1) */
  relevance: number;
  /** Confidence in the classification (0–1) */
  confidence: number;
  /** Human-readable explanation */
  reason: string;
  /** Score breakdown by topic */
  similarityScores?: Record<string, number>;
  /** Detailed human-readable explanation generated from scores */
  explanation?: string;
}

/** Interface for classification service implementations. */
export interface ClassificationService {
  /** Classify a video against a user profile. */
  classifyVideo(
    video: SerializableVideoMetadata,
    userProfile: UserProfile
  ): Promise<ClassificationResult>;
}

// ────────────────────────────────────────────
// Caching
// ────────────────────────────────────────────

/** Cache entry for a classified video. */
export interface CacheEntry {
  /** The classification result */
  result: ClassificationResult;
  /** Timestamp when cached (ms since epoch) */
  timestamp: number;
  /** Profile version used for classification */
  profileVersion: string;
}

// ────────────────────────────────────────────
// Messages (content ↔ background)
// ────────────────────────────────────────────

export interface ClassifyVideoMessage {
  type: 'CLASSIFY_VIDEO';
  video: SerializableVideoMetadata;
  userProfile: UserProfile;
}

export interface GetProfileMessage {
  type: 'GET_PROFILE';
}

export interface GetStatsMessage {
  type: 'GET_STATS';
}

export interface ToggleDebugMessage {
  type: 'TOGGLE_DEBUG';
  enabled: boolean;
}

export interface GetDebugMessage {
  type: 'GET_DEBUG';
}

export interface UpdateStatsMessage {
  type: 'UPDATE_STATS';
  action: string;
}

export interface GetFocusModeMessage {
  type: 'GET_FOCUS_MODE';
}

export interface UpdateFocusModeMessage {
  type: 'UPDATE_FOCUS_MODE';
  state: FocusModeState;
}

export interface DebugChangedMessage {
  type: 'DEBUG_CHANGED';
  enabled: boolean;
}

export interface UpdateProfileMessage {
  type: 'UPDATE_PROFILE';
  profile: UserProfile;
}

export interface ProfileChangedMessage {
  type: 'PROFILE_CHANGED';
}

export type ExtensionMessage =
  | ClassifyVideoMessage
  | GetProfileMessage
  | UpdateProfileMessage
  | ProfileChangedMessage
  | GetStatsMessage
  | ToggleDebugMessage
  | GetDebugMessage
  | UpdateStatsMessage
  | GetFocusModeMessage
  | UpdateFocusModeMessage
  | DebugChangedMessage;

// ────────────────────────────────────────────
// Statistics & Config
// ────────────────────────────────────────────

/** Statistics for the popup display. */
export interface FilterStats {
  totalProcessed: number;
  blocked: number;
  allowed: number;
  uncertain: number;
}

/** Debug mode configuration. */
export interface DebugConfig {
  enabled: boolean;
}
