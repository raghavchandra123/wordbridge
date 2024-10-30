import { PROGRESS_MIN_SIMILARITY, PROGRESS_MAX_SIMILARITY } from '@/lib/constants';

export const calculateProgress = (similarity: number): number => {
  console.log(`📊 Calculating progress for similarity: ${similarity}`);
  
  // Return 0 if similarity is less than or equal to PROGRESS_MIN_SIMILARITY
  if (similarity <= PROGRESS_MIN_SIMILARITY) {
    console.log(`📊 Progress: 0 (below minimum threshold)`);
    return 0;
  }
  
  // Return 100 if similarity is greater than or equal to PROGRESS_MAX_SIMILARITY
  if (similarity >= PROGRESS_MAX_SIMILARITY) {
    console.log(`📊 Progress: 100 (above maximum threshold)`);
    return 100;
  }
  
  // Linear interpolation between PROGRESS_MIN_SIMILARITY and PROGRESS_MAX_SIMILARITY
  const progress = ((similarity - PROGRESS_MIN_SIMILARITY) / (PROGRESS_MAX_SIMILARITY - PROGRESS_MIN_SIMILARITY)) * 100;
  console.log(`📊 Progress calculated: ${progress}`);
  return progress;
};