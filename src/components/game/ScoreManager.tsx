import { supabase } from '@/integrations/supabase/client';

export const updateDailyScore = async (userId: string, score: number): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('daily_scores')
      .upsert(
        { 
          user_id: userId, 
          score,
          date: new Date().toISOString().split('T')[0]
        },
        { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        }
      );

    if (error) {
      console.error('Error updating daily score:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateDailyScore:', error);
    return false;
  }
};