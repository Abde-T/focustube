import { VideoMetadata, UserProfile, FilterResult } from '../types';

/**
 * Deterministic local filtering.
 * Runs BEFORE any AI classification to avoid unnecessary API calls.
 *
 * IMPORTANT: In Focus Mode (detected by single-goal + hide mode),
 * category blocking is SKIPPED so the AI can properly evaluate
 * relevance to the focus topic.
 */

// ────────────────────────────────────────────
// Category keyword map
// ────────────────────────────────────────────

/**
 * Maps blocked category names to indicative keywords.
 * Used for simple title/channel heuristic matching.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  entertainment: [
    'funny', 'prank', 'challenge', 'try not to', 'compilation', 'fails',
    'tiktok', 'meme', 'memes', 'viral', 'cringe', 'satisfying',
    'asmr', 'mukbang', 'unboxing', 'vlog',
  ],
  celebrity: [
    'celebrity', 'kardashian', 'beyonce', 'taylor swift', 'drake',
    'kanye', 'gossip', 'red carpet', 'paparazzi', 'tmz',
    'hollywood', 'famous',
  ],
  drama: [
    'drama', 'beef', 'exposed', 'cancelled', 'canceled', 'tea',
    'response to', 'claps back', 'callout', 'call out', 'feud',
    'controversy', 'scandal',
  ],
  reaction: [
    'reaction', 'reacts to', 'reacting to', 'react', 'first time watching',
    'first time hearing', 'my reaction',
  ],
  gaming: [
    'gameplay', 'gaming', 'lets play', "let's play", 'walkthrough',
    'playthrough', 'fortnite', 'minecraft', 'roblox', 'gta',
    'valorant', 'league of legends', 'apex legends', 'call of duty',
    'elden ring', 'twitch', 'stream highlights', 'speedrun',
  ],
};

/**
 * Topic expansion keywords — maps goal/topic names to related terms.
 * Used for fast keyword-level relevance checking before AI runs.
 */
export const TOPIC_KEYWORDS: Record<string, string[]> = {
  'software engineering': [
    'software', 'engineering', 'developer', 'development', 'programming',
    'coding', 'code', 'coder', 'dev', 'api', 'backend', 'frontend',
    'full stack', 'fullstack', 'devops', 'agile', 'scrum', 'git',
    'github', 'debug', 'refactor', 'architecture', 'microservices',
    'system design', 'interview', 'leetcode', 'dsa', 'algorithm',
    'data structure', 'web dev', 'app dev', 'mobile dev',
    'computer science', 'computer', 'cs', 'tech', 'technology',
    'software engineer', 'software development', 'programming language',
    'javascript', 'python', 'java', 'typescript', 'react', 'node',
    'database', 'sql', 'nosql', 'cloud', 'aws', 'azure', 'docker',
    'kubernetes', 'linux', 'operating system', 'network', 'security',
  ],
  'programming': [
    'programming', 'coding', 'code', 'python', 'javascript', 'typescript',
    'java', 'c++', 'rust', 'golang', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'node', 'django', 'flask', 'spring',
    'tutorial', 'course', 'learn', 'beginner', 'advanced', 'project',
    'build', 'create', 'develop', 'compiler', 'interpreter',
  ],
  'entrepreneurship': [
    'entrepreneur', 'startup', 'business', 'founder', 'ceo', 'venture',
    'investment', 'pitch', 'saas', 'revenue', 'growth', 'marketing',
    'hustle', 'side project', 'bootstrap', 'fundraising', 'vc',
    'product market fit', 'mvp', 'launch',
  ],
  'science': [
    'science', 'physics', 'chemistry', 'biology', 'research', 'experiment',
    'scientific', 'discovery', 'nasa', 'space', 'quantum', 'molecule',
    'evolution', 'climate', 'nature', 'documentary', 'lab',
  ],
  'history': [
    'history', 'historical', 'ancient', 'medieval', 'war', 'empire',
    'civilization', 'century', 'archaeology', 'museum', 'documentary',
  ],
  'mathematics': [
    'math', 'mathematics', 'calculus', 'algebra', 'geometry', 'statistics',
    'probability', 'theorem', 'proof', 'equation', 'linear algebra',
  ],
  'language learning': [
    'language', 'learn', 'spanish', 'french', 'german', 'japanese',
    'chinese', 'korean', 'vocabulary', 'grammar', 'fluent', 'polyglot',
    'duolingo', 'immersion', 'pronunciation',
  ],
  'productivity': [
    'productivity', 'productive', 'time management', 'focus', 'habit',
    'routine', 'workflow', 'notion', 'obsidian', 'organization',
    'efficiency', 'goal setting', 'deep work', 'pomodoro',
  ],
  'personal finance': [
    'finance', 'financial', 'investing', 'investment', 'stock', 'crypto',
    'budget', 'money', 'wealth', 'savings', 'retirement', 'portfolio',
    'dividend', 'index fund', 'real estate',
  ],
  'design': [
    'design', 'ui', 'ux', 'figma', 'sketch', 'adobe', 'photoshop',
    'illustrator', 'graphic', 'typography', 'color theory', 'branding',
    'logo', 'creative', 'art', 'illustration', 'animation',
  ],
  'fitness': [
    'fitness', 'workout', 'exercise', 'gym', 'training', 'muscle',
    'cardio', 'strength', 'nutrition', 'diet', 'health', 'yoga',
    'running', 'bodybuilding', 'CrossFit', 'wellness',
  ],
  'cooking': [
    'cooking', 'recipe', 'cook', 'chef', 'kitchen', 'meal', 'food',
    'baking', 'nutrition', 'healthy eating', 'ingredient', 'dish',
  ],
};

/**
 * Check if a video title/channel text contains keywords related to a topic.
 * Returns a relevance score: number of matched keywords / total keywords.
 */
function topicKeywordRelevance(text: string, topic: string): number {
  const keywords = TOPIC_KEYWORDS[topic.toLowerCase()];
  if (!keywords || keywords.length === 0) {
    // Fallback: check if the topic name itself appears in the text
    return text.includes(topic.toLowerCase()) ? 0.6 : 0;
  }

  let matches = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      matches++;
    }
  }

  // Also check if the topic name itself appears
  if (text.includes(topic.toLowerCase())) {
    matches += 3; // Strong signal
  }

  // Normalize: even 1-2 keyword matches is a good signal
  if (matches >= 3) return 0.8;
  if (matches >= 2) return 0.6;
  if (matches >= 1) return 0.4;
  return 0;
}

/**
 * Attempt to match text against a list of blocked categories using keywords.
 * Returns the matched category name, or null.
 * 
 * IMPORTANT: Topic keywords take precedence over category keywords.
 * If text matches topic keywords first, category blocking is skipped.
 */
function matchBlockedCategory(
  text: string,
  blockedCategories: string[],
  userGoals: string[]
): string | null {
  // First, check if text matches user's goal keywords
  // If it does, skip category blocking to avoid false positives
  for (const goal of userGoals) {
    const goalKeywords = TOPIC_KEYWORDS[goal.toLowerCase()];
    if (goalKeywords) {
      for (const keyword of goalKeywords) {
        if (text.includes(keyword)) {
          // Matches a goal keyword - don't block based on category
          return null;
        }
      }
    }
  }
  
  // Then check category keywords
  for (const category of blockedCategories) {
    const keywords = CATEGORY_KEYWORDS[category.toLowerCase()];
    if (!keywords) continue;

    // Require at least 2 keyword matches for category blocking
    // This reduces false positives from single-word matches
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
        if (matches >= 2) {
          return category;
        }
      }
    }
  }
  return null;
}

/**
 * Detect if Focus Mode is active based on profile overrides.
 * (Focus Mode sets goals to single topic + blockedDisplayMode to 'hide')
 */
function isFocusMode(profile: UserProfile): boolean {
  return profile.goals.length === 1 && profile.blockedDisplayMode === 'hide';
}

// ────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────

/**
 * Apply all deterministic filters to a video.
 *
 * Evaluation order (first match wins):
 *   1. Allowed channels  → allow
 *   2. Shorts blocking   → block
 *   3. Focus Mode topic keyword match → allow (bypass category blocking)
 *   4. Blocked channels  → block
 *   5. Blocked keywords  → block
 *   6. Category keywords → block (SKIPPED in Focus Mode)
 *   7. No match          → uncertain (needs AI)
 */
export function applyLocalFilters(
  video: VideoMetadata,
  profile: UserProfile
): FilterResult {
  const focusActive = isFocusMode(profile);

  // ① Allowed channels (allowlist bypass)
  if (profile.allowedChannels?.length) {
    const channelLower = video.channel.toLowerCase();
    const isAllowed = profile.allowedChannels.some(
      allowed => channelLower.includes(allowed.toLowerCase())
    );
    if (isAllowed) {
      return {
        action: 'allow',
        reason: `Allowed channel: ${video.channel}`,
        confidence: 1.0,
        source: 'local',
      };
    }
  }

  // ② Shorts
  if (video.isShort) {
    if (profile.blockShorts) {
      return {
        action: 'block',
        reason: 'YouTube Short',
        confidence: 1.0,
        source: 'local',
      };
    }
    
    if (video.videoId.startsWith('shorts-shelf-')) {
      return {
        action: 'allow',
        reason: 'Shorts shelf wrapper',
        confidence: 1.0,
        source: 'local',
      };
    }
  }

  // ③ In Focus Mode: check if video matches the focus topic via keywords.
  //    If it does, ALLOW immediately — don't let category blocking interfere.
  if (focusActive) {
    const combined = `${video.title.toLowerCase()} ${video.channel.toLowerCase()}`;
    const focusTopic = profile.goals[0];
    const relevance = topicKeywordRelevance(combined, focusTopic);
    
    if (relevance >= 0.4) {
      return {
        action: 'allow',
        reason: `Matches focus topic: ${focusTopic} (keyword relevance ${Math.round(relevance * 100)}%)`,
        confidence: relevance,
        source: 'local',
      };
    }
    
    // In Focus Mode, skip category blocking — let AI evaluate everything else
    return {
      action: 'uncertain',
      reason: 'Focus Mode: requires AI classification',
      confidence: 0,
      source: 'local',
    };
  }

  // ④ Blocked channels (only outside Focus Mode from here)
  if (profile.blockedChannels?.length) {
    const channelLower = video.channel.toLowerCase();
    const blockedChannel = profile.blockedChannels.find(
      blocked => channelLower.includes(blocked.toLowerCase())
    );
    if (blockedChannel) {
      return {
        action: 'block',
        reason: `Blocked channel: ${blockedChannel}`,
        confidence: 1.0,
        source: 'local',
      };
    }
  }

  // ⑤ Blocked keywords in title
  if (profile.blockedKeywords?.length) {
    const titleLower = video.title.toLowerCase();
    const matchedKeyword = profile.blockedKeywords.find(
      keyword => titleLower.includes(keyword.toLowerCase())
    );
    if (matchedKeyword) {
      return {
        action: 'block',
        reason: `Blocked keyword: "${matchedKeyword}"`,
        confidence: 1.0,
        source: 'local',
      };
    }
  }

  // ⑥ Category heuristic (title + channel)
  if (profile.blockedCategories?.length) {
    const combined = `${video.title.toLowerCase()} ${video.channel.toLowerCase()}`;
    const matchedCategory = matchBlockedCategory(combined, profile.blockedCategories, profile.goals);
    if (matchedCategory) {
      return {
        action: 'block',
        reason: `Category: ${matchedCategory}`,
        confidence: 0.85,
        source: 'local',
        categories: [matchedCategory],
      };
    }
  }

  // ⑦ No deterministic match — needs AI classification
  return {
    action: 'uncertain',
    reason: 'Requires AI classification',
    confidence: 0,
    source: 'local',
  };
}
