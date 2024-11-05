import { supabase } from '@/integrations/supabase/client';
import { logDatabaseOperation } from '@/lib/utils/dbLogger';

export const updateDailyScore = async (userId: string, score: number, seedDate: string | undefined) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Log whether this is a daily game
    const isDailyGame = seedDate === today;
    logDatabaseOperation('Daily Score Update Check', {
      seedDate,
      today,
      isDailyGame,
      score
    });

    // Only update if this is a daily game
    if (!isDailyGame) {
      logDatabaseOperation('Daily Score Update Skipped', {
        reason: 'Not a daily game',
        seedDate,
        today
      });
      return;
    }

    // First check if there's an existing score for today
    const { data: existingScore, error: fetchError } = await supabase
      .from('daily_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logDatabaseOperation('Daily Score Fetch Error', { error: fetchError });
      throw fetchError;
    }

    logDatabaseOperation('Daily Score Comparison', {
      existingScore: existingScore?.score,
      newScore: score,
      shouldUpdate: !existingScore || score < existingScore.score
    });

    // Only update if there's no score or if the new score is better (lower)
    if (!existingScore || score < existingScore.score) {
      const { error } = await supabase
        .from('daily_scores')
        .upsert({
          user_id: userId,
          score,
          date: today
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        logDatabaseOperation('Daily Score Update Error', { error });
        throw error;
      }

      logDatabaseOperation('Daily Score Updated', {
        userId,
        score,
        date: today,
        previousScore: existingScore?.score
      });
    } else {
      logDatabaseOperation('Daily Score Update Skipped', {
        reason: 'Existing score is better',
        existingScore: existingScore.score,
        newScore: score
      });
    }
  } catch (error) {
    console.error('Error in updateDailyScore:', error);
    throw error;
  }
};

export const updateExperience = async (userId: string, amount: number) => {
  try {
    // First get current experience
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('experience')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentExp = currentProfile?.experience || 0;
    const newExp = currentExp + amount;

    const { error } = await supabase
      .from('profiles')
      .update({ experience: newExp })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating experience:', error);
    throw error;
  }
};

export const updateTotalStats = async (userId: string, score: number) => {
  try {
    // First get current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_statistics')
      .select('total_games, total_score')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    const totalGames = (currentStats?.total_games || 0) + 1;
    const totalScore = (currentStats?.total_score || 0) + score;

    const { error } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        total_games: totalGames,
        total_score: totalScore
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating total stats:', error);
    throw error;
  }
};
