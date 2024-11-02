import { checkConceptNetRelation } from "../conceptnet";
import { cosineSimilarity } from "../embeddings";
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from "../constants";

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  // Start both checks in parallel
  const similarityPromise = cosineSimilarity(previousWord, word);
  const conceptNetPromise = checkConceptNetRelation(previousWord, word);

  // Wait for BOTH checks to complete
  const [similarity, hasConceptNetRelation] = await Promise.all([
    similarityPromise,
    conceptNetPromise
  ]);

  // Word is valid if EITHER check passes
  const isValid = similarity >= ADJACENT_WORD_MIN_SIMILARITY || hasConceptNetRelation;

  return {
    isValid,
    similarity,
    conceptNetRelation: hasConceptNetRelation
  };
};

export const validateWordWithTarget = async (word: string, targetWord: string) => {
  // Start both checks in parallel immediately
  const similarityPromise = cosineSimilarity(word, targetWord);
  const conceptNetPromise = checkConceptNetRelation(word, targetWord);

  // Wait for similarity to calculate progress
  const similarity = await similarityPromise;
  const progress = Math.max(0, Math.min(100, (similarity + 0.2) / 0.45 * 100));
  
  return {
    similarity,
    progress,
    // Keep checking ConceptNet in background
    conceptNetPromise,
    // Game is complete if EITHER check passes
    isComplete: similarity >= TARGET_WORD_MIN_SIMILARITY || await conceptNetPromise
  };
};
