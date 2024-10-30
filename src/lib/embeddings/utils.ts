import { PROGRESS_MIN_SIMILARITY, PROGRESS_MAX_SIMILARITY } from '@/lib/constants';

export const calculateProgress = (similarity: number): number => {
  if (similarity <= PROGRESS_MIN_SIMILARITY) return 0;
  if (similarity >= PROGRESS_MAX_SIMILARITY) return 100;
  
  return ((similarity - PROGRESS_MIN_SIMILARITY) / (PROGRESS_MAX_SIMILARITY - PROGRESS_MIN_SIMILARITY)) * 100;
};