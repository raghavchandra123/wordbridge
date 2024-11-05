import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';

export const updateDailyScore = async (userId: string, score: number): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Use the update_daily_score function which handles the comparison logic
    const { data, error } = await supabase
      .rpc('update_daily_score', {
        p_user_id: userId,
        p_score: score,
        p_date: today
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