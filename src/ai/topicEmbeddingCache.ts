/**
 * Topic Embedding Cache
 * 
 * Manages caching of semantic topic profile embeddings to avoid
 * repeated computation. Embeddings are generated once and reused.
 */

import { embed, similarity } from './embeddingService';
import { getSemanticProfile, SemanticProfile } from '../data/semanticProfiles';

export interface TopicEmbedding {
  topic: string;
  prototypeEmbeddings: number[][]; // Embeddings for each prototype
}

export interface TopicMatchScore {
  topic: string;
  score: number;
  prototypeIndex: number; // Which prototype matched best
}

/**
 * In-memory cache for topic embeddings
 */
const topicEmbeddingCache = new Map<string, TopicEmbedding>();

/**
 * In-memory cache for video text embeddings
 * Key: normalized text, Value: embedding vector
 */
const videoTextEmbeddingCache = new Map<string, number[]>();

/**
 * Maximum cache size to prevent memory issues
 */
const MAX_VIDEO_CACHE_SIZE = 1000;

/**
 * Cache key for chrome.storage
 */
const STORAGE_KEY = 'focustube_topic_embeddings';

/**
 * Get or generate embeddings for a topic's semantic profile
 */
export async function getTopicEmbeddings(topic: string): Promise<TopicEmbedding> {
  const topicLower = topic.toLowerCase();
  
  // Check in-memory cache first
  if (topicEmbeddingCache.has(topicLower)) {
    return topicEmbeddingCache.get(topicLower)!;
  }
  
  // Get semantic profile
  const profile = getSemanticProfile(topic);
  
  // Generate embeddings for all prototypes
  const prototypeEmbeddings: number[][] = [];
  for (const prototype of profile.prototypes) {
    const embedding = await embed(prototype);
    if (embedding.length > 0) {
      prototypeEmbeddings.push(embedding);
    }
  }
  
  const topicEmbedding: TopicEmbedding = {
    topic: topicLower,
    prototypeEmbeddings,
  };
  
  // Cache in memory
  topicEmbeddingCache.set(topicLower, topicEmbedding);
  
  return topicEmbedding;
}

/**
 * Get or generate embeddings for multiple topics in parallel
 */
export async function getMultipleTopicEmbeddings(topics: string[]): Promise<Map<string, TopicEmbedding>> {
  const results = new Map<string, TopicEmbedding>();
  
  const promises = topics.map(async (topic) => {
    const embedding = await getTopicEmbeddings(topic);
    results.set(topic.toLowerCase(), embedding);
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * Get or generate embedding for video text with caching
 */
export async function getVideoTextEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim().toLowerCase();
  
  // Check cache first
  if (videoTextEmbeddingCache.has(normalizedText)) {
    return videoTextEmbeddingCache.get(normalizedText)!;
  }
  
  // Generate embedding
  const embedding = await embed(normalizedText);
  
  if (embedding.length > 0) {
    // Manage cache size
    if (videoTextEmbeddingCache.size >= MAX_VIDEO_CACHE_SIZE) {
      // Remove oldest entry (first key)
      const firstKey = videoTextEmbeddingCache.keys().next().value;
      if (firstKey) {
        videoTextEmbeddingCache.delete(firstKey);
      }
    }
    
    // Cache the embedding
    videoTextEmbeddingCache.set(normalizedText, embedding);
  }
  
  return embedding;
}

/**
 * Calculate similarity between a text embedding and a topic's prototypes
 * Returns the highest similarity score across all prototypes
 */
export function scoreTopicAgainstEmbedding(
  textEmbedding: number[],
  topicEmbedding: TopicEmbedding
): TopicMatchScore {
  let bestScore = 0;
  let bestPrototypeIndex = 0;
  
  for (let i = 0; i < topicEmbedding.prototypeEmbeddings.length; i++) {
    const prototypeEmbedding = topicEmbedding.prototypeEmbeddings[i];
    const score = similarity(textEmbedding, prototypeEmbedding);
    
    if (score > bestScore) {
      bestScore = score;
      bestPrototypeIndex = i;
    }
  }
  
  return {
    topic: topicEmbedding.topic,
    score: bestScore,
    prototypeIndex: bestPrototypeIndex,
  };
}

/**
 * Calculate similarity between a text and multiple topics
 * Returns scores sorted by highest first
 */
export async function scoreTextAgainstTopics(
  text: string,
  topics: string[]
): Promise<TopicMatchScore[]> {
  // Generate text embedding with caching
  const textEmbedding = await getVideoTextEmbedding(text);
  if (textEmbedding.length === 0) {
    return [];
  }
  
  // Get all topic embeddings
  const topicEmbeddings = await getMultipleTopicEmbeddings(topics);
  
  // Calculate scores
  const scores: TopicMatchScore[] = [];
  for (const [topic, embedding] of topicEmbeddings) {
    const match = scoreTopicAgainstEmbedding(textEmbedding, embedding);
    scores.push(match);
  }
  
  // Sort by highest score first
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Clear the in-memory cache
 */
export function clearCache(): void {
  topicEmbeddingCache.clear();
  videoTextEmbeddingCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { 
  topicCacheSize: number; 
  videoCacheSize: number; 
  topics: string[] 
} {
  return {
    topicCacheSize: topicEmbeddingCache.size,
    videoCacheSize: videoTextEmbeddingCache.size,
    topics: Array.from(topicEmbeddingCache.keys()),
  };
}

/**
 * Persist embeddings to chrome.storage (optional)
 * Currently using in-memory cache only for simplicity
 */
export async function persistToStorage(): Promise<void> {
  // Future implementation if persistence is needed
  // For now, in-memory cache is sufficient
}

/**
 * Load embeddings from chrome.storage (optional)
 * Currently using in-memory cache only for simplicity
 */
export async function loadFromStorage(): Promise<void> {
  // Future implementation if persistence is needed
  // For now, in-memory cache is sufficient
}
