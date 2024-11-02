import { cosineSimilarity } from "../embeddings";
import { checkConceptNetRelation } from "../conceptnet";
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from "../constants";

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  // First check similarity as it's faster (local computation)
  const similarity = await cosineSimilarity(previousWord, word);
  
  // If similarity check passes, then check ConceptNet
  if (similarity >= ADJACENT_WORD_MIN_SIMILARITY) {
    return {
      isValid: true,
      similarity,
      conceptNetRelation: false
    };
  }

  // Only check ConceptNet if similarity check fails
  try {
    const conceptNetRelation = await checkConceptNetRelation(previousWord, word);
    return {
      isValid: conceptNetRelation,
      similarity,
      conceptNetRelation
    };
  } catch (error) {
    console.error('ConceptNet validation failed:', error);
    return {
      isValid: false,
      similarity,
      conceptNetRelation: false
    };
  }
};

export const validateWordWithTarget = async (word: string, targetWord: string) => {
  const similarity = await cosineSimilarity(word, targetWord);
  const progress = Math.max(0, Math.min(100, (similarity + 0.2) / 0.45 * 100));
  
  // Check if we've reached target similarity threshold
  if (similarity >= TARGET_WORD_MIN_SIMILARITY) {
    return {
      similarity,
      progress,
      isComplete: true
    };
  }

  // Only check ConceptNet if similarity isn't high enough
  try {
    const conceptNetRelation = await checkConceptNetRelation(word, targetWord);
    return {
      similarity,
      progress,
      isComplete: conceptNetRelation
    };
  } catch (error) {
    console.error('ConceptNet validation failed:', error);
    return {
      similarity,
      progress,
      isComplete: false
    };
  }
};