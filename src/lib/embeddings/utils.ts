import { SIMILARITY_THRESHOLDS } from "@/lib/constants";

export const calculateProgress = (similarity: number): number => {
  const progress = (similarity / SIMILARITY_THRESHOLDS.TARGET) * 100;
  return Math.max(0, Math.min(100, progress));
};