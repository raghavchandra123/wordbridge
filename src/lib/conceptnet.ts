import { toast } from "@/components/ui/use-toast";

const CORS_PROXY = "https://corsproxy.io/";

export const checkConceptNetRelation = async (word1: string, word2: string): Promise<boolean> => {
  console.log(`🌐 Starting ConceptNet check between "${word1}" and "${word2}"`);
  try {
    const apiUrl = `https://api.conceptnet.io/query?node=/c/en/${word1}&other=/c/en/${word2}`;
    const proxyUrl = `${CORS_PROXY}?${encodeURIComponent(apiUrl)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.edges && data.edges.length > 0;
  } catch (error) {
    console.error('❌ ConceptNet API error:', error);
    // Don't show error toast since ConceptNet is optional
    return false;
  }
};