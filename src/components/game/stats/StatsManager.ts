import { supabase } from '@/integrations/supabase/client';
import { logDatabaseOperation } from '@/lib/utils/dbLogger';

export const updateGameStats = async (userId: string, score: number, seedDate: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isDailyGame = seedDate === today;
    
    // Get current stats in a single query
    const { data: currentStats, error: statsError } = await supabase
      .from('profiles')
      .select(`
        level,
        experience,
        user_statistics (
          total_games,
          total_score
        )
      `)
      .eq('id', userId)
      .single();

    if (statsError) throw statsError;

    // Calculate new values
    const currentLevel = currentStats?.level || 1;
    const currentExperience = currentStats?.experience || 0;
    const experienceGained = Math.ceil(100 / (score * (1 + 0.1 * currentLevel)));
    const newExperience = currentExperience + experienceGained;
    const newTotalGames = (currentStats?.user_statistics?.total_games || 0) + 1;
    const newTotalScore = (currentStats?.user_statistics?.total_score || 0) + score;

    // Batch update all stats in a single transaction
    const { error: updateError } = await supabase.rpc('batch_update_stats', {
      p_user_id: userId,
      p_experience: newExperience,
      p_total_games: newTotalGames,
      p_total_score: newTotalScore,
      p_score: score,
      p_date: isDailyGame ? today : null
    });

    if (updateError) throw updateError;

    return {
      newExperience,
      newTotalGames,
      newTotalScore,
      experienceGained
    };
  } catch (error) {
    logDatabaseOperation('Game Stats Update Failed', { error });
    throw error;
  }
};