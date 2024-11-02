import { toast } from "@/components/ui/use-toast";

export const checkConceptNetRelation = async (word1: string, word2: string): Promise<boolean> => {
  console.log(`🌐 Starting ConceptNet check between "${word1}" and "${word2}"`);
  try {
    // First try with regular CORS
    const response = await fetch(
      `https://api.conceptnet.io/query?node=/c/en/${word1}&other=/c/en/${word2}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        // Set a timeout to avoid hanging
        signal: AbortSignal.timeout(3000)
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.edges && data.edges.length > 0;
    }
    
    // If regular request fails, return true to not block gameplay
    console.log('⚠️ ConceptNet API unavailable, allowing word connection');
    return true;
  } catch (error) {
    console.error('❌ ConceptNet API error:', error);
    // Return true on error to not block gameplay
    return true;
  }
};