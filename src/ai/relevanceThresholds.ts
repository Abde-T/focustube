/**
 * Relevance Threshold Configuration
 * 
 * Defines configurable thresholds for semantic similarity scoring.
 * These values are calibrated based on the embedding model's behavior
 * and should be tested with representative examples.
 */

export const RELEVANCE_THRESHOLDS = {
  /**
   * Strong match threshold
   * Videos scoring above this are clearly relevant to the topic.
   * Used for high-confidence classification decisions.
   */
  STRONG: 0.7,
  
  /**
   * Moderate match threshold
   * Videos scoring above this are likely relevant but may need
   * additional context or confirmation.
   */
  MODERATE: 0.5,
  
  /**
   * Weak match threshold
   * Videos scoring above this have some semantic relationship
   * but are not clearly relevant. Set just above default threshold
   * so videos at default threshold are labeled "Very weak".
   */
  WEAK: 0.35,
  
  /**
   * User intent matching threshold
   * Used when matching user descriptions to topics in the AI Topic Generator.
   * Higher threshold because we want to be confident about topic suggestions.
   */
  USER_INTENT: 0.4,
  
  /**
   * Default relevance threshold for video classification
   * Videos scoring below this will be blocked by default.
   * Users can adjust this in settings.
   */
  DEFAULT_VIDEO_THRESHOLD: 0.3,
  
  /**
   * Focus mode minimum threshold
   * In Focus Mode, the threshold is at least this value regardless
   * of user settings, to ensure stricter filtering.
   */
  FOCUS_MODE_MINIMUM: 0.35,
  
  /**
   * Keyword match threshold
   * If keyword overlap score is above this, it's considered a strong
   * signal and takes precedence over embedding scores.
   */
  KEYWORD_MATCH: 0.5,
  
  /**
   * Combined method agreement threshold
   * If both embedding and keyword methods score above this,
   * we boost the combined score.
   */
  METHOD_AGREEMENT: 0.25,
  
  /**
   * Combined method boost multiplier
   * When both methods agree, multiply the score by this factor.
   */
  METHOD_AGREEMENT_BOOST: 1.3,
} as const;

/**
 * Get a human-readable label for a similarity score based on thresholds.
 */
export function getSimilarityLabel(score: number): string {
  if (score >= RELEVANCE_THRESHOLDS.STRONG) return 'Strong';
  if (score >= RELEVANCE_THRESHOLDS.MODERATE) return 'Moderate';
  if (score >= RELEVANCE_THRESHOLDS.WEAK) return 'Weak';
  return 'Very weak';
}

/**
 * Determine if a score indicates strong relevance.
 */
export function isStrongMatch(score: number): boolean {
  return score >= RELEVANCE_THRESHOLDS.STRONG;
}

/**
 * Determine if a score indicates moderate relevance.
 */
export function isModerateMatch(score: number): boolean {
  return score >= RELEVANCE_THRESHOLDS.MODERATE;
}

/**
 * Determine if a score indicates weak relevance.
 */
export function isWeakMatch(score: number): boolean {
  return score >= RELEVANCE_THRESHOLDS.WEAK;
}
