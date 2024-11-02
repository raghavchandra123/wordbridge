import { checkConceptNetRelation } from "../conceptnet";
import { cosineSimilarity } from "../embeddings";
import { ADJACENT_WORD_MIN_SIMILARITY, TARGET_WORD_MIN_SIMILARITY } from "../constants";

export const validateWordWithPrevious = async (word: string, previousWord: string) => {
  console.log(`🔍 Starting validation between "${previousWord}" and "${word}"`);
  
  // Start both checks in parallel
  const similarityPromise = cosineSimilarity(previousWord, word);
  const conceptNetPromise = checkConceptNetRelation(previousWord, word);

  // First check similarity
  const similarity = await similarityPromise;
  
  // If similarity passes, we can return immediately
  if (similarity >= ADJACENT_WORD_MIN_SIMILARITY) {
    return {
      isValid: true,
      similarity,
      conceptNetRelation: false
    };
  }

  // If similarity failed, we MUST wait for ConceptNet before deciding
  const hasConceptNetRelation = await conceptNetPromise;
  
  return {
    isValid: hasConceptNetRelation, // Only invalid if both checks fail
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