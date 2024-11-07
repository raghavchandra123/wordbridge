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

    // Update experience
    const { error: expError } = await supabase
      .from('profiles')
      .update({ experience: newExperience })
      .eq('id', userId);

    if (expError) throw expError;

    // Update total stats
    const { error: statsUpdateError } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        total_games: newTotalGames,
        total_score: newTotalScore
      }, {
        onConflict: 'user_id'
      });

    if (statsUpdateError) throw statsUpdateError;

    // Update daily score if it's a daily game
    if (isDailyGame) {
      const { error: dailyError } = await supabase
        .from('daily_scores')
        .upsert({
          user_id: userId,
          score,
          date: today
        }, {
          onConflict: 'user_id,date'
        });

      if (dailyError) throw dailyError;
    }

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