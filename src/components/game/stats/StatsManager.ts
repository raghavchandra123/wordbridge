import { supabase } from '@/integrations/supabase/client';
import { logDatabaseOperation } from './StatsLogger';
import { toast } from '@/components/ui/use-toast';

export const updateTotalStats = async (userId: string, score: number) => {
  try {
    // First get current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_statistics')
      .select('total_games, total_score')
      .eq('user_id', userId)
      .single();

    logDatabaseOperation('Fetching Current Stats', { currentStats, error: fetchError });
    
    if (fetchError) throw fetchError;

    const newTotalGames = (currentStats?.total_games || 0) + 1;
    const newTotalScore = (currentStats?.total_score || 0) + score;

    logDatabaseOperation('Calculating New Stats', { 
      currentStats,
      newTotalGames,
      newTotalScore 
    });

    const { error: updateError } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        total_games: newTotalGames,
        total_score: newTotalScore
      });

    if (updateError) throw updateError;

    logDatabaseOperation('Stats Updated Successfully', {
      newTotalGames,
      newTotalScore
    });

  } catch (error) {
    logDatabaseOperation('Error Updating Stats', { error });
    toast({
      title: "Error Updating Stats",
      description: "Failed to update game statistics",
      variant: "destructive",
    });
  }
};

export const updateExperience = async (userId: string, score: number) => {
  try {
    const experienceGain = Math.floor((20 - score) * 10);
    logDatabaseOperation('Calculating Experience Gain', { score, experienceGain });

    const { error } = await supabase.rpc(
      'increment_experience',
      { 
        user_id: userId,
        amount: experienceGain
      }
    );

    if (error) throw error;

    logDatabaseOperation('Experience Updated Successfully', { experienceGain });

  } catch (error) {
    logDatabaseOperation('Error Updating Experience', { error });
    toast({
      title: "Error Updating Experience",
      description: "Failed to update experience points",
      variant: "destructive",
    });
  }
};

export const updateDailyScore = async (userId: string, score: number, seedDate: string | undefined) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isDaily = seedDate === today;
    
    logDatabaseOperation('Checking Daily Game Status', { 
      seedDate,
      today,
      isDaily 
    });

    if (!isDaily) {
      logDatabaseOperation('Skipping Daily Score Update - Not Daily Game', {
        seedDate,
        today
      });
      return;
    }

    const { error } = await supabase.rpc(
      'update_daily_score',
      { 
        p_user_id: userId,
        p_score: score,
        p_date: today
      }
    );

    if (error) throw error;

    logDatabaseOperation('Daily Score Updated Successfully', { score });

  } catch (error) {
    logDatabaseOperation('Error Updating Daily Score', { error });
    toast({
      title: "Error Updating Daily Score",
      description: "Failed to update daily score",
      variant: "destructive",
    });
  }
};