import { ClassificationService } from '../types';
import { SemanticClassifier } from './mockClassifier';

/**
 * Factory function to create the active classification service.
 *
 * Currently returns the MockClassifier.
 * When a real LLM provider is integrated, update this function
 * to return the appropriate implementation based on user config.
 */
export function createClassificationService(): ClassificationService {
  return new SemanticClassifier();
}
