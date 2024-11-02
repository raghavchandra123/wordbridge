import { toast } from "@/components/ui/use-toast";

export const checkConceptNetRelation = async (word1: string, word2: string): Promise<boolean> => {
  console.log(`🌐 Starting ConceptNet check between "${word1}" and "${word2}"`);
  try {
    const response = await fetch(
      `https://api.conceptnet.io/query?node=/c/en/${word1}&other=/c/en/${word2}`
    );
    if (!response.ok) {
      console.error(`❌ ConceptNet API error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    const hasRelation = data.edges && data.edges.length > 0;
    console.log(`✅ ConceptNet check complete:
      - Words: "${word1}" → "${word2}"
      - Result: ${hasRelation ? "Related" : "Not related"}
      - Found ${data.edges?.length || 0} relations`);
    return hasRelation;
  } catch (error) {
    console.error('❌ ConceptNet API error:', error);
    toast({
      title: "ConceptNet API Error",
      description: "There was an error checking word relations. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};