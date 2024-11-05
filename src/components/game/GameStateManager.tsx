import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/types';
import { saveGameStats } from '@/lib/storage/gameStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSyncGameStats } from '@/hooks/useSyncGameStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';
import { logDatabaseOperation } from '@/lib/utils/dbLogger';

interface GameStateManagerProps {
  game: GameState;
  onGameComplete: () => void;
}

export const GameStateManager = ({ game, onGameComplete }: GameStateManagerProps) => {
  const { session } = useAuth();
  const hasUpdatedRef = useRef(false);
  useSyncGameStats(session?.user?.id);

  useEffect(() => {
    const updateScore = async () => {
      if (!game.isComplete || !session?.user?.id || hasUpdatedRef.current) {
        return;
      }

      try {
        hasUpdatedRef.current = true;
        const score = game.currentChain.length - 1;
        
        // Check if this is a daily game by verifying it was seeded with today's date
        const today = new Date().toISOString().split('T')[0];
        const isDaily = game.metadata?.seedDate === today;
        
        logDatabaseOperation('Check Daily Game', { isDaily, seedDate: game.metadata?.seedDate });

        // For daily games only, update the daily score
        if (isDaily) {
          logDatabaseOperation('Updating Daily Score', { userId: session.user.id, score, date: today });
          
          // First get current daily score
          const { data: existingScore, error: scoreGetError } = await supabase
            .from('daily_scores')
            .select('score')
            .eq('user_id', session.user.id)
            .eq('date', today)
            .single();
            
          logDatabaseOperation('Existing Daily Score', { existingScore, error: scoreGetError });

          // Only update if no score exists or new score is better (lower)
          if (!existingScore || score < existingScore.score) {
            const { error: scoreError } = await supabase
              .from('daily_scores')
              .upsert({
                user_id: session.user.id,
                score,
                date: today
              }, {
                onConflict: 'user_id,date'
              });

            if (scoreError) {
              logDatabaseOperation('Daily Score Update Error', scoreError);
              throw scoreError;
            }
            
            logDatabaseOperation('Daily Score Updated', { score });
          }
        }

        // Calculate and update experience
        const experienceGain = Math.floor(100 / score);
        logDatabaseOperation('Calculating Experience', { score, experienceGain });

        // Get current experience first
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('experience')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          logDatabaseOperation('Profile Fetch Error', profileError);
          throw profileError;
        }

        logDatabaseOperation('Current Profile', { currentProfile });

        // Update experience with direct calculation
        const newExperience = (currentProfile?.experience || 0) + experienceGain;
        const { error: expError } = await supabase
          .from('profiles')
          .update({ experience: newExperience })
          .eq('id', session.user.id);

        if (expError) {
          logDatabaseOperation('Experience Update Error', expError);
          throw expError;
        }

        logDatabaseOperation('Experience Updated', { newExperience });

        // Get current stats
        const { data: currentStats, error: statsGetError } = await supabase
          .from('user_statistics')
          .select('total_games, total_score')
          .eq('user_id', session.user.id)
          .single();

        logDatabaseOperation('Current Stats Fetch', { currentStats, error: statsGetError });

        // Calculate new stats
        const newTotalGames = (currentStats?.total_games || 0) + 1;
        const newTotalScore = (currentStats?.total_score || 0) + score;

        // Update user statistics
        const { error: statsError } = await supabase
          .from('user_statistics')
          .upsert({
            user_id: session.user.id,
            total_games: newTotalGames,
            total_score: newTotalScore
          }, {
            onConflict: 'user_id'
          });

        if (statsError) {
          logDatabaseOperation('Stats Update Error', statsError);
          throw statsError;
        }

        logDatabaseOperation('Stats Updated', { newTotalGames, newTotalScore });

        // Save local stats
        saveGameStats(score, isDaily);
        
      } catch (error) {
        console.error('Error in updateScore:', error);
        logDatabaseOperation('Update Score Error', error);
        toast({
          description: "There was an issue saving your game progress.",
          variant: "destructive",
        });
      } finally {
        onGameComplete();
      }
    };

    updateScore();
  }, [game.isComplete, game.currentChain.length, game.startWord, session?.user?.id, onGameComplete, game.metadata?.seedDate]);

  return null;
};