import { SIMILARITY_THRESHOLD } from "@/lib/constants";

const MIN_SIMILARITY = -0.1;
const MAX_SIMILARITY = 0.3;

export const calculateProgress = (similarity: number): number => {
  if (similarity <= MIN_SIMILARITY) return 0;
  if (similarity >= MAX_SIMILARITY) return 100;
  
  // Map similarity from [MIN_SIMILARITY, MAX_SIMILARITY] to [0, 100]
  const progress = ((similarity - MIN_SIMILARITY) / (MAX_SIMILARITY - MIN_SIMILARITY)) * 100;
  return Math.max(0, Math.min(100, progress));
};