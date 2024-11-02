import { checkConceptNetRelation } from "../conceptnet";
import { cosineSimilarity } from "../embeddings";
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from "../constants";

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  // Start both checks in parallel
  const similarityPromise = cosineSimilarity(previousWord, word);
  const conceptNetPromise = checkConceptNetRelation(previousWord, word);

  // Create a promise that resolves when EITHER validation passes
  return Promise.race([
    // Similarity check path
    similarityPromise.then(similarity => ({
      isValid: similarity >= ADJACENT_WORD_MIN_SIMILARITY,
      similarity,
      conceptNetRelation: false
    })),
    // ConceptNet check path
    conceptNetPromise.then(hasRelation => ({
      isValid: hasRelation,
      similarity: 0,
      conceptNetRelation: hasRelation
    }))
  ]);
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
