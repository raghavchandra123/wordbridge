import { toast } from "@/components/ui/use-toast";

const CORS_PROXY = "https://corsproxy.io/?";

export const checkConceptNetRelation = async (word1: string, word2: string): Promise<boolean> => {
  console.log(`🌐 Starting ConceptNet check between "${word1}" and "${word2}"`);
  
  try {
    const apiUrl = `https://api.conceptnet.io/query?node=/c/en/${word1}&other=/c/en/${word2}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
    
    console.log(`📡 Sending request to: ${proxyUrl}`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout reached, aborting...');
      controller.abort();
    }, 5000); // 5 second timeout

    console.log('🔄 Fetching data...');
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`✅ Response received with status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Response not OK: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('📦 Parsing JSON response...');
    const data = await response.json();
    
    const hasRelation = data.edges && data.edges.length > 0;
    console.log(`🔍 Relation found: ${hasRelation}`, {
      edgesCount: data.edges?.length || 0
    });
    
    return hasRelation;
  } catch (error) {
    // Log detailed error information
    console.error('❌ ConceptNet API error:', {
      error,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    // Don't show error toast since ConceptNet is optional
    return false;
  }
};