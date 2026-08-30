import { pipeline, env } from '@xenova/transformers';

// Configure environment for browser extension
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

// Polyfill URL.createObjectURL for Service Worker environment
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => {
      console.warn('URL.createObjectURL is not supported in this environment.');
      return '';
    },
    writable: true,
  });
}

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let pipelinePromise: Promise<any> | null = null;
const embeddingCache = new Map<string, number[]>();

/**
 * Initialize the pipeline in the background without blocking.
 * Call this early to pre-warm the model.
 */
export function initializePipeline(): void {
  if (!pipelinePromise) {
    pipelinePromise = pipeline('feature-extraction', MODEL_ID, {
      progress_callback: (info: any) => {
        if (info.status === 'progress') {
          console.log(`[FocusTube] Model loading: ${Math.round(info.progress * 100)}%`);
        }
      },
    });
  }
}

export type ProgressCallback = (info: any) => void;

/**
 * Get or initialize the embedding pipeline.
 */
export async function getPipeline(onProgress?: ProgressCallback): Promise<any> {
  if (!pipelinePromise) {
    pipelinePromise = pipeline('feature-extraction', MODEL_ID, {
      progress_callback: onProgress,
    });
  }
  return pipelinePromise;
}

/**
 * Generate an embedding vector for the given text.
 */
export async function embed(text: string, onProgress?: ProgressCallback): Promise<number[]> {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return [];
  }

  // Check cache first
  if (embeddingCache.has(normalizedText)) {
    return embeddingCache.get(normalizedText)!;
  }

  const extractor = await getPipeline(onProgress);
  
  // Generate embeddings
  const output = await extractor(normalizedText, { pooling: 'mean', normalize: true });
  
  // Convert Float32Array to standard array
  const vector = Array.from(output.data) as number[];
  
  // Cache and return
  embeddingCache.set(normalizedText, vector);
  return vector;
}

/**
 * Calculate cosine similarity between two vectors.
 */
export function similarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface TopicScore {
  topic: string;
  score: number;
}

/**
 * Find topics that match a user query above a certain threshold.
 */
export async function findSimilarTopics(
  query: string,
  topics: string[],
  threshold: number = 0.45,
  onProgress?: ProgressCallback
): Promise<TopicScore[]> {
  const queryEmbedding = await embed(query, onProgress);
  const results: TopicScore[] = [];

  for (const topic of topics) {
    const topicEmbedding = await embed(topic, onProgress);
    const score = similarity(queryEmbedding, topicEmbedding);
    if (score >= threshold) {
      results.push({ topic, score });
    }
  }

  // Sort by highest score first
  return results.sort((a, b) => b.score - a.score);
}
