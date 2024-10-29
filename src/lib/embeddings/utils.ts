import { SIMILARITY_THRESHOLDS } from "@/lib/constants";

export const calculateProgress = (similarity: number): number => {
  // Map similarity from [-0.3, SIMILARITY_THRESHOLDS.TARGET] to [0, 100]
  const progress = ((similarity + 0.3) / (SIMILARITY_THRESHOLDS.TARGET + 0.3)) * 100;
  return Math.max(0, Math.min(100, progress));
};