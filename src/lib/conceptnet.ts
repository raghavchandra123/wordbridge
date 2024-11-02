import { toast } from "@/components/ui/use-toast";

// Using allorigins.win as it's more reliable
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export const checkConceptNetRelation = async (word1: string, word2: string): Promise<boolean> => {
  console.log(`🌐 Starting ConceptNet check between "${word1}" and "${word2}"`);
  try {
    const apiUrl = `https://api.conceptnet.io/query?node=/c/en/${word1}&other=/c/en/${word2}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear timeout if fetch completes

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.edges && data.edges.length > 0;
    } catch (fetchError) {
      // If it's a network error, try without CORS proxy as fallback
      if (fetchError.name === 'AbortError' || fetchError.message.includes('Failed to fetch')) {
        console.log('⚠️ CORS proxy failed, trying direct request...');
        const directResponse = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });
        const data = await directResponse.json();
        return data.edges && data.edges.length > 0;
      }
      throw fetchError;
    }
  } catch (error) {
    // If it's an abort error (timeout) or any other error, log it and return false
    console.error('❌ ConceptNet API error:', error);
    // Don't show error toast since ConceptNet is optional
    return false;
  }
};