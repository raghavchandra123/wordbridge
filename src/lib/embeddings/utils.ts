import { PROGRESS_MIN_SIMILARITY, PROGRESS_MAX_SIMILARITY } from '@/lib/constants';

export const calculateProgress = (similarity: number): number => {
  // Return 0 if similarity is less than or equal to PROGRESS_MIN_SIMILARITY
  if (similarity <= PROGRESS_MIN_SIMILARITY) return 0;
  
  // Return 100 if similarity is greater than or equal to PROGRESS_MAX_SIMILARITY
  if (similarity >= PROGRESS_MAX_SIMILARITY) return 100;
  
  // Linear interpolation between PROGRESS_MIN_SIMILARITY and PROGRESS_MAX_SIMILARITY
  return ((similarity - PROGRESS_MIN_SIMILARITY) / (PROGRESS_MAX_SIMILARITY - PROGRESS_MIN_SIMILARITY)) * 100;
};