import { cosineSimilarity } from "../embeddings";
import { checkConceptNetRelation } from "../conceptnet";
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
  // For target word, we need both checks to pass
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
};