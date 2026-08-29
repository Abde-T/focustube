import { ClassificationResult } from '../types';

export function generateClassificationExplanation(
  classification: ClassificationResult,
  selectedTopics: string[]
): string {
  if (!classification.similarityScores) {
    return classification.reason;
  }

  const scores = Object.entries(classification.similarityScores)
    .sort(([, a], [, b]) => b - a);
  
  if (scores.length === 0) {
    return classification.reason;
  }

  let lines: string[] = [];

  // Add the top scores
  const topScores = scores.slice(0, 3);
  for (const [topic, score] of topScores) {
    const percentage = Math.round(score * 100);
    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
    lines.push(`${capitalizedTopic} — ${percentage}%`);
  }

  lines.push(''); // Empty line

  // Add contextual explanation based on action
  if (classification.action === 'uncertain') {
    const highestScore = scores[0][1];
    if (highestScore > 0.25) {
      lines.push('Moderate relevance to your current focus.');
      lines.push('Review recommended.');
    } else {
      lines.push('Low relevance to your interests.');
      lines.push('May be a distraction.');
    }
  } else if (classification.action === 'allow') {
    lines.push('Strong match for your active focus topics.');
  } else if (classification.action === 'block') {
    lines.push('Matches blocked or distracting categories.');
  }

  return lines.join('\n');
}
