import { supabase } from '@/integrations/supabase/client';
import { logDatabaseOperation } from '@/lib/utils/dbLogger';

export const updateDailyScore = async (userId: string, score: number, seedDate: string | undefined) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Only update if this is a daily game (seedDate matches today)
    if (seedDate !== today) {
      return;
    }

    const { error } = await supabase
      .from('daily_scores')
      .upsert({
        user_id: userId,
        score,
        date: today
      }, {
        onConflict: 'user_id,date'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating daily score:', error);
    throw error;
  }
};

export const updateExperience = async (userId: string, amount: number) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ experience: supabase.rpc('increment', { x: amount }) })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating experience:', error);
    throw error;
  }
};

export const updateTotalStats = async (userId: string, score: number) => {
  try {
    const { error } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        total_games: supabase.rpc('increment', { x: 0 }),
        total_score: score
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating total stats:', error);
    throw error;
  }
};