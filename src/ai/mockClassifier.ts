import { ClassificationService, ClassificationResult, SerializableVideoMetadata, UserProfile } from '../types';
import { embed, similarity } from './embeddingService';
import { scoreTextAgainstTopics, scoreTopicAgainstEmbedding, getTopicEmbeddings } from './topicEmbeddingCache';
import { TOPIC_KEYWORDS } from '../content/videoFilter';
import { getTopicWeights } from '../storage/preferences';
import { getFocusState } from '../storage/focusMode';
import { RELEVANCE_THRESHOLDS, getSimilarityLabel } from './relevanceThresholds';

/**
 * Semantic implementation of ClassificationService.
 *
 * Uses a hybrid approach:
 * 1. Keyword overlap scoring (fast, reliable for known topics)
 * 2. Embedding similarity via Transformers.js (handles novel content)
 * 3. Combined score for final decision
 */

/**
 * Expand a short topic name into a richer description for better embeddings.
 * Short texts produce poor embeddings — padding with related terms helps.
 */
function expandTopicForEmbedding(topic: string): string {
  const keywords = TOPIC_KEYWORDS[topic.toLowerCase()];
  if (keywords && keywords.length > 0) {
    // Use the topic + a subset of its keywords for a richer embedding
    return `${topic} ${keywords.slice(0, 10).join(' ')}`;
  }
  return topic;
}

/**
 * Calculate keyword overlap score between video text and a topic.
 */
function keywordOverlapScore(videoText: string, topic: string): number {
  const textLower = videoText.toLowerCase();
  const topicLower = topic.toLowerCase();

  // Direct topic name match is a strong signal
  if (textLower.includes(topicLower)) {
    return 0.8;
  }

  // Check for word variations (e.g., "programmer" for "programming")
  const topicVariations = getTopicVariations(topicLower);
  for (const variation of topicVariations) {
    if (textLower.includes(variation)) {
      return 0.75;
    }
  }

  // Check keywords from the topic expansion map
  const keywords = TOPIC_KEYWORDS[topicLower];
  if (!keywords || keywords.length === 0) {
    // No keyword map — check if any word from the topic appears
    const topicWords = topicLower.split(/\s+/);
    const matchCount = topicWords.filter(w => w.length > 2 && textLower.includes(w)).length;
    return matchCount > 0 ? Math.min(0.6, matchCount * 0.25) : 0;
  }

  let matches = 0;
  for (const keyword of keywords) {
    if (textLower.includes(keyword)) {
      matches++;
    }
  }

  if (matches >= 4) return 0.8;
  if (matches >= 3) return 0.7;
  if (matches >= 2) return 0.55;
  if (matches >= 1) return 0.4;
  return 0;
}

/**
 * Get common word variations for a topic (e.g., programming -> programmer, programmers)
 */
function getTopicVariations(topic: string): string[] {
  const variations: string[] = [];
  
  // Add -er, -ers, -ing variations
  if (topic.endsWith('ing')) {
    variations.push(topic.slice(0, -3) + 'er'); // programming -> programmer
    variations.push(topic.slice(0, -3) + 'ers'); // programming -> programmers
  }
  if (topic.endsWith('er')) {
    variations.push(topic + 's'); // programmer -> programmers
    variations.push(topic.slice(0, -2) + 'ing'); // programmer -> programming
  }
  
  return variations;
}

/**
 * Generate a human-readable explanation for the classification result.
 * Shows actual semantic scores with descriptive labels.
 */
function generateClassificationExplanation(result: ClassificationResult, activeGoals: string[]): string {
  const lines: string[] = [];
  
  if (result.action === 'allow') {
    lines.push(`✓ This video matches your focus`);
    lines.push(`Topic: ${result.categories.join(', ')}`);
  } else if (result.action === 'block') {
    lines.push(`✗ This video doesn't match your current focus`);
    if (result.categories.length > 0) {
      lines.push(`Closest match: ${result.categories[0]}`);
    }
  }
  
  // Show top topic scores
  if (result.similarityScores && Object.keys(result.similarityScores).length > 0) {
    lines.push('');
    lines.push('Topic relevance:');
    
    const sortedScores = Object.entries(result.similarityScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Show top 3
    
    for (const [topic, score] of sortedScores) {
      const label = getSimilarityLabel(score);
      lines.push(`  • ${topic} — ${label}`);
    }
  }
  
  return lines.join('\n');
}

export class SemanticClassifier implements ClassificationService {
  async classifyVideo(
    video: SerializableVideoMetadata,
    userProfile: UserProfile
  ): Promise<ClassificationResult> {
    const titleLower = video.title.toLowerCase();
    const channelLower = video.channel.toLowerCase();
    
    // Include description if available for better semantic matching
    const descriptionText = video.description ? ` ${video.description.toLowerCase()}` : '';
    const combined = `${titleLower} ${channelLower}${descriptionText}`;

    // Check Focus Mode
    const focus = await getFocusState();
    const activeGoals = focus.active && focus.topic ? [focus.topic] : userProfile.goals;

    // If no goals, can't do semantic matching
    if (activeGoals.length === 0) {
       return {
        action: 'block',
        categories: ['unrelated'],
        relevance: 0.0,
        confidence: 0.9,
        reason: 'No focus topics selected',
      };
    }

    // In normal mode (not focus), check blocked categories first
    if (!focus.active) {
      for (const category of userProfile.blockedCategories) {
        const catLower = category.toLowerCase();
        if (combined.includes(catLower)) {
          return {
            action: 'block',
            categories: [category],
            relevance: 0.1,
            confidence: 0.9,
            reason: `Matches blocked category: ${category}`,
          };
        }
      }
    }

    // Fetch learned preferences
    const weights = await getTopicWeights();

    // Use semantic topic profiles for scoring
    const topicScores = await scoreTextAgainstTopics(combined, activeGoals);
    
    // Combine with keyword scoring for hybrid approach
    const similarityScores: Record<string, number> = {};
    let highestScore = 0;
    let bestTopic = '';

    for (const goal of activeGoals) {
      // Get semantic score from topic profiles
      const semanticMatch = topicScores.find(m => m.topic === goal.toLowerCase());
      const semanticScore = semanticMatch ? semanticMatch.score : 0;
      
      // Get keyword overlap score
      const keywordScore = keywordOverlapScore(combined, goal);

      // Combined score: prioritize semantic scores, use keyword as boost
      // Don't let keyword matches alone override weak semantic scores
      let score = semanticScore;
      
      // If keyword score is high, boost the semantic score but don't replace it
      if (keywordScore >= RELEVANCE_THRESHOLDS.KEYWORD_MATCH) {
        score = Math.max(semanticScore, semanticScore * 1.2); // Boost semantic score by 20%
      } else {
        // Otherwise, take the higher of the two
        score = Math.max(semanticScore, keywordScore);
      }

      // If BOTH methods agree the content is relevant, boost further
      if (semanticScore > RELEVANCE_THRESHOLDS.METHOD_AGREEMENT && keywordScore > RELEVANCE_THRESHOLDS.METHOD_AGREEMENT) {
        score = Math.min(1.0, score * RELEVANCE_THRESHOLDS.METHOD_AGREEMENT_BOOST);
      }
      
      // Apply learned weight adjustments
      const weight = weights[goal] || 0;
      if (weight > 0) {
        score = score + (1.0 - score) * weight; // Boost
      } else if (weight < 0) {
        score = score + score * weight; // Penalize
      }

      similarityScores[goal] = score;
      
      if (score > highestScore) {
        highestScore = score;
        bestTopic = goal;
      }
    }

    let action: 'allow' | 'block' | 'uncertain' = 'uncertain';
    let reason = '';

    // Use user's relevance threshold for allow decision
    const userThreshold = userProfile.relevanceThreshold ?? RELEVANCE_THRESHOLDS.DEFAULT_VIDEO_THRESHOLD;
    let allowThreshold = userThreshold;

    if (focus.active) {
      // Focus Mode: stricter threshold
      allowThreshold = Math.max(userThreshold, RELEVANCE_THRESHOLDS.FOCUS_MODE_MINIMUM);
    }

    // Check similarity label
    const similarityLabel = getSimilarityLabel(highestScore);
    const isVeryWeak = similarityLabel === 'Very weak';
    const isWeak = similarityLabel === 'Weak';

    // Get the best keyword score for this video
    let bestKeywordScore = 0;
    for (const goal of activeGoals) {
      const kwScore = keywordOverlapScore(combined, goal);
      if (kwScore > bestKeywordScore) {
        bestKeywordScore = kwScore;
      }
    }

    // Allow if:
    // 1. Score meets threshold AND not very weak, OR
    // 2. Semantic is weak but keyword match is strong (>= 0.5)
    const allowByThreshold = highestScore >= allowThreshold && !isVeryWeak;
    const allowByKeyword = isWeak && bestKeywordScore >= RELEVANCE_THRESHOLDS.KEYWORD_MATCH;

    if (allowByThreshold || allowByKeyword) {
      action = 'allow';
      reason = `Relevant to ${bestTopic} (similarity: ${similarityLabel})`;
    } else {
      action = 'block';
      reason = `Relevance score below your selected ${Math.round(allowThreshold * 100)}% (similarity: ${similarityLabel})`;
    }

    const result: ClassificationResult = {
      action,
      categories: [bestTopic],
      relevance: highestScore,
      confidence: Math.min(0.95, highestScore + 0.3), // Confidence is separate from relevance
      reason,
      similarityScores,
    };

    result.explanation = generateClassificationExplanation(result, activeGoals);
    return result;
  }
}
