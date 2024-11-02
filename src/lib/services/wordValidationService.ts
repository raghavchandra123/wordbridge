import { cosineSimilarity } from "../embeddings";
import { checkConceptNetRelation } from "../conceptnet";
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from "../constants";

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  const [similarity, conceptNetRelation] = await Promise.all([
    cosineSimilarity(previousWord, word),
    checkConceptNetRelation(previousWord, word)
  ]);

  return {
    isValid: similarity >= ADJACENT_WORD_MIN_SIMILARITY || conceptNetRelation,
    similarity,
    conceptNetRelation
  };
};

export const validateWordWithTarget = async (word: string, targetWord: string) => {
  const [similarity, conceptNetRelation] = await Promise.all([
    cosineSimilarity(word, targetWord),
    checkConceptNetRelation(word, targetWord)
  ]);

  return {
    similarity,
    progress: Math.max(0, Math.min(100, (similarity + 0.2) / 0.45 * 100)),
    isComplete: conceptNetRelation || similarity >= TARGET_WORD_MIN_SIMILARITY
  };
};