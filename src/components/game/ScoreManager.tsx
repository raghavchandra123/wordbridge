import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';

export const updateDailyScore = async (userId: string, score: number): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('update_daily_score', {
        p_user_id: userId,
        p_score: score,
        p_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error updating score:', error);
      toast({
        title: "Error Saving Score",
        description: "There was an issue saving your score. Your progress has been saved locally.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateDailyScore:', error);
    return false;
  }
};