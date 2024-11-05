import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/types';
import { saveGameStats } from '@/lib/storage/gameStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSyncGameStats } from '@/hooks/useSyncGameStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';
import { updateDailyScore } from './ScoreManager';

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
        const isDaily = !game.startWord.includes('-');
        
        if (isDaily) {
          await updateDailyScore(session.user.id, score);
          
          // Calculate experience gain
          const experienceGain = Math.floor(100 / score);
          
          // First get current stats
          const { data: currentStats, error: fetchError } = await supabase
            .from('user_statistics')
            .select('total_games, total_score')
            .eq('user_id', session.user.id)
            .single();

          if (fetchError) {
            console.error('Error fetching statistics:', fetchError);
            return;
          }

          // Update experience using increment_experience function
          const { error: expError } = await supabase
            .rpc('increment_experience', {
              user_id: session.user.id,
              amount: experienceGain
            });

          if (expError) {
            console.error('Error updating experience:', expError);
            toast({
              description: "There was an issue updating your experience points.",
              variant: "destructive",
            });
          }

          // Update statistics with incremented values
          const newTotalGames = (currentStats?.total_games || 0) + 1;
          const newTotalScore = (currentStats?.total_score || 0) + score;

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
            console.error('Error updating statistics:', statsError);
            toast({
              description: "There was an issue updating your statistics.",
              variant: "destructive",
            });
          }
        }

        saveGameStats(score, isDaily);
      } catch (error) {
        console.error('Error in updateScore:', error);
        toast({
          description: "There was an issue saving your game progress.",
          variant: "destructive",
        });
      } finally {
        onGameComplete();
      }
    };

    updateScore();
  }, [game.isComplete, game.currentChain.length, game.startWord, session?.user?.id, onGameComplete]);

  return null;
};