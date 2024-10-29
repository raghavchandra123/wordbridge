export const checkConceptNetRelation = async (word1: string, word2: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.conceptnet.io/query?node=/c/en/${word1}&other=/c/en/${word2}`
    );
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.edges && data.edges.length > 0;
  } catch (error) {
    console.error('ConceptNet API error:', error);
    return false;
  }
};