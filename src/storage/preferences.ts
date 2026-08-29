// src/storage/preferences.ts

export interface UserDecision {
  videoId: string;
  topics: string[]; // the topics the video was matched against
  decision: 'allow' | 'block';
  timestamp: number;
}

export type TopicWeights = Record<string, number>;

const KEYS = {
  DECISIONS: 'focustube_decisions',
  WEIGHTS: 'focustube_weights'
};

export async function recordDecision(
  videoId: string,
  topics: string[],
  decision: 'allow' | 'block'
): Promise<void> {
  try {
    const data = await chrome.storage.local.get([KEYS.DECISIONS, KEYS.WEIGHTS]);
    const decisions: UserDecision[] = data[KEYS.DECISIONS] || [];
    const weights: TopicWeights = data[KEYS.WEIGHTS] || {};

    // Record decision
    decisions.push({
      videoId,
      topics,
      decision,
      timestamp: Date.now()
    });

    // Keep history reasonably sized
    if (decisions.length > 500) {
      decisions.shift();
    }

    // Update weights: +0.1 for allow, -0.1 for block
    const delta = decision === 'allow' ? 0.1 : -0.1;
    for (const topic of topics) {
      weights[topic] = (weights[topic] || 0) + delta;
      
      // Bound the weights
      if (weights[topic] > 1.0) weights[topic] = 1.0;
      if (weights[topic] < -1.0) weights[topic] = -1.0;
    }

    await chrome.storage.local.set({
      [KEYS.DECISIONS]: decisions,
      [KEYS.WEIGHTS]: weights
    });
  } catch (e) {
    console.warn('[FocusTube] Error recording decision', e);
  }
}

export async function getTopicWeights(): Promise<TopicWeights> {
  try {
    const data = await chrome.storage.local.get(KEYS.WEIGHTS);
    return data[KEYS.WEIGHTS] || {};
  } catch {
    return {};
  }
}

export async function resetPreferences(): Promise<void> {
  try {
    await chrome.storage.local.remove([KEYS.DECISIONS, KEYS.WEIGHTS]);
  } catch (e) {
    console.warn('[FocusTube] Error resetting preferences', e);
  }
}
