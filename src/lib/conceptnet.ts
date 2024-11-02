import { toast } from "@/components/ui/use-toast";

const CORS_PROXY = "https://corsproxy.io/?";

export const checkConceptNetRelation = async (word1: string, word2: string): Promise<boolean> => {
  console.log(`🔍 Starting ConceptNet check for "${word1}" and "${word2}"`);
  
  try {
    const apiUrl = `https://api.conceptnet.io/query?node=/c/en/${word1}&other=/c/en/${word2}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout reached, aborting...');
      controller.abort();
    }, 5000); // 5 second timeout

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ Response not OK: ${response.status} ${response.statusText}`);
      toast({
        description: "Network error occurred. Please check your internet connection and try again.",
        variant: "destructive"
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const hasRelation = data.edges && data.edges.length > 0;
    
    console.log(`✨ Finished ConceptNet check for "${word1}" and "${word2}": ${hasRelation ? 'Relation found!' : 'No relation found'}`);
    
    return hasRelation;
  } catch (error) {
    // Log detailed error information
    console.error('❌ ConceptNet API error:', {
      error,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    toast({
      description: "Network error occurred. Please check your internet connection and try again.",
      variant: "destructive"
    });
    
    throw error; // Re-throw to ensure the check is treated as failed
  }
};