import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';

export const updateDailyScore = async (userId: string, score: number): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_scores')
      .upsert(
        { 
          user_id: userId, 
          date: today, 
          score: score 
        },
        { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false 
        }
      );

    if (error) {
      console.error('Error updating score:', error);
      toast({
        title: "Error Saving Score",
        description: "There was an issue saving your score.",
        variant: "destructive",
      });
      return false;
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