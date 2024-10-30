const MIN_SIMILARITY = -0.1;
const MAX_SIMILARITY = 0.3;

export const calculateProgress = (similarity: number): number => {
  // Return 0 if similarity is less than or equal to MIN_SIMILARITY
  if (similarity <= MIN_SIMILARITY) return 0;
  
  // Return 100 if similarity is greater than or equal to MAX_SIMILARITY
  if (similarity >= MAX_SIMILARITY) return 100;
  
  // Linear interpolation between MIN_SIMILARITY and MAX_SIMILARITY
  return ((similarity - MIN_SIMILARITY) / (MAX_SIMILARITY - MIN_SIMILARITY)) * 100;
};