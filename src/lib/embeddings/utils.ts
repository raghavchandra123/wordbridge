import { SIMILARITY_THRESHOLDS } from "@/lib/constants";

export const calculateProgress = (similarity: number): number => {
  const progress = ((similarity - SIMILARITY_THRESHOLDS.MIN) / (SIMILARITY_THRESHOLDS.TARGET - SIMILARITY_THRESHOLDS.MIN)) * 100;
  return Math.max(0, Math.min(100, progress));
};