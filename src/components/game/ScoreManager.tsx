import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';

export const updateDailyScore = async (userId: string, score: number): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if there's an existing score for today
    const { data: existingScore } = await supabase
      .from('daily_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Only update if there's no score or if the new score is better (lower)
    if (!existingScore || score < existingScore.score) {
      const { error } = await supabase
        .from('daily_scores')
        .upsert({
          user_id: userId,
          score: score,
          date: today
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error updating score:', error);
        toast({
          title: "Error Saving Score",
          description: "There was an issue saving your score.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateDailyScore:', error);
    toast({
      title: "Error Saving Score",
      description: "There was an issue saving your score.",
      variant: "destructive",
    });
    return false;
  }
};