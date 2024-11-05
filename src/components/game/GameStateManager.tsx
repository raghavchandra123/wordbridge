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
          const success = await updateDailyScore(session.user.id, score);
          
          if (success) {
            // Update experience
            const experienceGain = Math.round(100 / score);
            const { error: expError } = await supabase
              .rpc('increment_experience', {
                user_id: session.user.id,
                amount: experienceGain
              });

            if (expError) {
              console.error('Error updating experience:', expError);
            }

            // Update statistics
            const { error: statsError } = await supabase
              .from('user_statistics')
              .upsert(
                {
                  user_id: session.user.id,
                  total_games: 1,
                  total_score: score
                },
                {
                  onConflict: 'user_id'
                }
              );

            if (statsError) {
              console.error('Error updating statistics:', statsError);
            }
          }
        }

        saveGameStats(score, isDaily);
        onGameComplete();
      } catch (error) {
        console.error('Error in updateScore:', error);
        hasUpdatedRef.current = false;
        
        toast({
          title: "Error Updating Score",
          description: "There was an error saving your score. Please try again.",
          variant: "destructive",
        });
      }
    };

    updateScore();
  }, [game.isComplete, game.currentChain.length, game.startWord, session?.user?.id, onGameComplete]);

  return null;
};