import { checkConceptNetRelation } from "../conceptnet";
import { cosineSimilarity } from "../embeddings";
import { TARGET_WORD_MIN_SIMILARITY } from "../constants";

export const validateWordWithTarget = async (word: string, targetWord: string) => {
  const [similarity, conceptNetRelation] = await Promise.all([
    cosineSimilarity(word, targetWord),
    checkConceptNetRelation(word, targetWord)
  ]);

  // If there's a ConceptNet relation, override similarity to ensure game completion
  const finalSimilarity = conceptNetRelation ? 1.0 : similarity;
  const progress = conceptNetRelation ? 100 : calculateProgress(finalSimilarity);
  
  return {
    similarity: finalSimilarity,
    progress,
    isComplete: conceptNetRelation || finalSimilarity >= TARGET_WORD_MIN_SIMILARITY
  };
};

const calculateProgress = (similarity: number): number => {
  if (similarity <= 0.2) return 0;
  if (similarity >= 0.8) return 100;
  return ((similarity - 0.2) / (0.8 - 0.2)) * 100;
};