import { supabase } from '@/integrations/supabase/client';
import { logDatabaseOperation } from './StatsLogger';
import { toast } from '@/components/ui/use-toast';

export const updateTotalStats = async (userId: string, score: number) => {
  try {
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_statistics')
      .select('total_games, total_score')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const newTotalGames = (currentStats?.total_games || 0) + 1;
    const newTotalScore = (currentStats?.total_score || 0) + score;

    const { error: updateError } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        total_games: newTotalGames,
        total_score: newTotalScore
      });

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating stats:', error);
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
    
    // Direct update without RPC
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        experience: supabase.sql`experience + ${experienceGain}` 
      })
      .eq('id', userId);

    if (updateError) throw updateError;

  } catch (error) {
    console.error('Error updating experience:', error);
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
    
    // Only proceed if this is a daily game
    if (!isDaily) {
      return;
    }

    // First fetch existing score
    const { data: existingScore, error: fetchError } = await supabase
      .from('daily_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

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
    }

  } catch (error) {
    console.error('Error updating daily score:', error);
    toast({
      title: "Error Updating Daily Score",
      description: "Failed to update daily score",
      variant: "destructive",
    });
  }
};