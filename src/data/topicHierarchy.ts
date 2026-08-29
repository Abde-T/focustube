/**
 * Topic Hierarchy
 * 
 * Defines parent/child relationships for topics.
 * UI shows parent topics, but filtering logic uses specific child topics.
 * 
 * When user selects a parent topic in UI, all child topics are included.
 * When AI Topic Generator detects a specific sub-topic request, it creates
 * that specific child topic for focused filtering.
 */

export interface TopicNode {
  id: string;
  label: string;
  parentId?: string; // If present, this is a child topic
  children?: string[]; // If present, this is a parent topic
}

/**
 * Parent topic categories for UI display
 * Each parent groups multiple related sub-topics
 */
export const PARENT_TOPICS: Record<string, { label: string; children: string[] }> = {
  'tech': {
    label: 'Tech',
    children: [
      'programming',
      'software engineering',
      'web development',
      'mobile development',
      'data science',
      'machine learning',
      'artificial intelligence',
      'cybersecurity',
      'devops',
      'cloud computing',
      'engineering',
      'mechanical engineering',
      'electrical engineering',
      'civil engineering',
    ]
  },
  'business': {
    label: 'Business',
    children: [
      'entrepreneurship',
      'business',
      'marketing',
      'sales',
      'finance',
      'investing',
      'personal finance',
      'economics',
    ]
  },
  'science': {
    label: 'Science',
    children: [
      'science',
      'physics',
      'chemistry',
      'biology',
      'astronomy',
      'environmental science',
      'mathematics',
      'calculus',
      'statistics',
      'algebra',
      'geometry',
    ]
  },
  'history': {
    label: 'History',
    children: [
      'history',
      'world history',
      'ancient history',
      'modern history',
    ]
  },
  'languages': {
    label: 'Languages',
    children: [
      'language learning',
      'english',
      'spanish',
      'french',
      'german',
      'japanese',
      'chinese',
      'korean',
    ]
  },
  'productivity': {
    label: 'Productivity',
    children: [
      'productivity',
      'time management',
      'goal setting',
      'study skills',
      'personal development',
      'self improvement',
    ]
  },
  'design': {
    label: 'Design',
    children: [
      'design',
      'graphic design',
      'ui design',
      'ux design',
      'photography',
      'video editing',
      'animation',
      'architecture',
      'interior design',
    ]
  },
  'health': {
    label: 'Health',
    children: [
      'fitness',
      'mental health',
      'meditation',
      'mindfulness',
      'yoga',
      'nutrition',
      'medicine',
      'nursing',
    ]
  },
  'cooking': {
    label: 'Cooking',
    children: [
      'cooking',
      'baking',
      'healthy eating',
      'meal prep',
    ]
  },
  'music': {
    label: 'Music',
    children: [
      'music',
      'guitar',
      'piano',
      'music production',
      'songwriting',
    ]
  },
  'writing': {
    label: 'Writing',
    children: [
      'writing',
      'creative writing',
      'journaling',
      'blogging',
    ]
  },
  'social_sciences': {
    label: 'Social Sciences',
    children: [
      'philosophy',
      'psychology',
      'sociology',
      'political science',
      'law',
      'education',
      'teaching',
      'research',
    ]
  },
  'lifestyle': {
    label: 'Lifestyle',
    children: [
      'gardening',
      'diy',
      'woodworking',
      'automotive',
      'travel',
      'geography',
      'cultures',
      'religion',
    ]
  }
};

/**
 * Get the parent topic for a given child topic
 */
export function getParentTopic(childTopicId: string): string | null {
  for (const [parentId, parent] of Object.entries(PARENT_TOPICS)) {
    if (parent.children.includes(childTopicId)) {
      return parentId;
    }
  }
  return null;
}

/**
 * Get all child topics for a parent topic
 */
export function getChildTopics(parentTopicId: string): string[] {
  const parent = PARENT_TOPICS[parentTopicId];
  return parent ? parent.children : [];
}

/**
 * Check if a topic is a parent topic
 */
export function isParentTopic(topicId: string): boolean {
  return PARENT_TOPICS.hasOwnProperty(topicId);
}

/**
 * Check if a topic is a child topic
 */
export function isChildTopic(topicId: string): boolean {
  return getParentTopic(topicId) !== null;
}

/**
 * Expand parent topics to their child topics
 * Used when filtering: if user selects "Tech", include all tech sub-topics
 */
export function expandTopics(topics: string[]): string[] {
  const expanded: string[] = [];
  
  for (const topic of topics) {
    if (isParentTopic(topic)) {
      // Expand parent to all children
      expanded.push(...getChildTopics(topic));
    } else {
      // Keep child topics as-is
      expanded.push(topic);
    }
  }
  
  return [...new Set(expanded)]; // Remove duplicates
}

/**
 * Group child topics by their parent for UI display
 */
export function groupTopicsByParent(topics: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const topic of topics) {
    const parent = getParentTopic(topic);
    if (parent) {
      if (!grouped[parent]) {
        grouped[parent] = [];
      }
      grouped[parent].push(topic);
    } else {
      // Topic has no parent, group under "other"
      if (!grouped['other']) {
        grouped['other'] = [];
      }
      grouped['other'].push(topic);
    }
  }
  
  return grouped;
}
