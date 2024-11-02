import { cosineSimilarity } from "../embeddings";
import { checkConceptNetRelation } from "../conceptnet";
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from "../constants";

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  try {
    const [similarity, conceptNetRelation] = await Promise.all([
      cosineSimilarity(previousWord, word),
      checkConceptNetRelation(previousWord, word)
    ]);

    return {
      isValid: similarity >= ADJACENT_WORD_MIN_SIMILARITY || conceptNetRelation,
      similarity,
      conceptNetRelation
    };
  } catch (error) {
    console.error('Word validation failed:', error);
    return {
      isValid: false,
      similarity: 0,
      conceptNetRelation: false
    };
  }
};

export const validateWordWithTarget = async (word: string, targetWord: string) => {
  try {
    const [similarity, conceptNetRelation] = await Promise.all([
      cosineSimilarity(word, targetWord),
      checkConceptNetRelation(word, targetWord)
    ]);

    const progress = Math.max(0, Math.min(100, (similarity + 0.2) / 0.45 * 100));

    return {
      similarity,
      progress,
      isComplete: conceptNetRelation || similarity >= TARGET_WORD_MIN_SIMILARITY
    };
  } catch (error) {
    console.error('Target validation failed:', error);
    return {
      similarity: 0,
      progress: 0,
      isComplete: false
    };
  }
};