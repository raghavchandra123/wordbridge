import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getGameStats, clearGameStats } from '@/lib/storage/gameStats';

export const useSyncGameStats = (userId: string | undefined) => {
  useEffect(() => {
    const syncStats = async () => {
      if (!userId) return;
      
      const stats = getGameStats();
      if (stats.totalGames === 0) return;

      try {
        // Update user statistics using upsert with onConflict
        const { error: statsError } = await supabase
          .from('user_statistics')
          .upsert({
            user_id: userId,
            total_games: stats.totalGames,
            total_score: stats.totalScore,
          }, {
            onConflict: 'user_id'
          });

        if (statsError) throw statsError;

        // Update daily score if exists and is from today
        if (stats.dailyScore) {
          const today = new Date().toISOString().split('T')[0];
          if (stats.dailyScore.date === today) {
            const { error: scoreError } = await supabase
              .from('daily_scores')
              .upsert({
                user_id: userId,
                score: stats.dailyScore.score,
                date: today
              }, {
                onConflict: 'user_id,date'
              });

            if (scoreError) throw scoreError;
          }
        }

        // Clear local storage after successful sync
        clearGameStats();
      } catch (error) {
        console.error('Error syncing game stats:', error);
      }
    };

    syncStats();
  }, [userId]);
};