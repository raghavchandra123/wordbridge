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

    // Get current experience
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('experience')
      .eq('id', userId)
      .single();

    logDatabaseOperation('Current Profile Data', { currentProfile, error: fetchError });
    
    if (fetchError) throw fetchError;

    const newExperience = (currentProfile?.experience || 0) + experienceGain;

    // Direct update with integer value
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ experience: newExperience })
      .eq('id', userId);

    if (updateError) throw updateError;

    logDatabaseOperation('Experience Updated', { newExperience });

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

    // Get current daily score
    const { data: existingScore, error: fetchError } = await supabase
      .from('daily_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    logDatabaseOperation('Fetching Existing Daily Score', { 
      existingScore,
      error: fetchError 
    });

    // Only update if no existing score or new score is better (lower)
    if (!existingScore || score < existingScore.score) {
      const { error: updateError } = await supabase
        .from('daily_scores')
        .upsert({
          user_id: userId,
          score,
          date: today
        });

      if (updateError) throw updateError;

      logDatabaseOperation('Daily Score Updated', { score });
    } else {
      logDatabaseOperation('Daily Score Not Updated - Existing Score Better', {
        existingScore: existingScore.score,
        newScore: score
      });
    }

  } catch (error) {
    logDatabaseOperation('Error Updating Daily Score', { error });
    toast({
      title: "Error Updating Daily Score",
      description: "Failed to update daily score",
      variant: "destructive",
    });
  }
};