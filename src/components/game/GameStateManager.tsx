import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/types';
import { saveGameStats } from '@/lib/storage/gameStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSyncGameStats } from '@/hooks/useSyncGameStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';
import { startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface GameStateManagerProps {
  game: GameState;
  onGameComplete: () => void;
}

const calculateExperienceGain = (score: number, currentLevel: number) => {
  return Math.round(100 / score / (1 + 0.1 * currentLevel));
};

export const GameStateManager = ({ game, onGameComplete }: GameStateManagerProps) => {
  const { session } = useAuth();
  const hasUpdatedRef = useRef(false);
  useSyncGameStats(session?.user?.id);

  useEffect(() => {
    const updateScore = async () => {
      if (!game.isComplete || !session?.user?.id || hasUpdatedRef.current) {
        return;
      }

      const score = game.currentChain.length - 1;
      const isDaily = !game.startWord.includes('-');
      
      try {
        hasUpdatedRef.current = true;

        if (isDaily) {
          const today = startOfDay(toZonedTime(new Date(), 'GMT'));
          
          // Get current user level for XP calculation
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('level')
            .eq('id', session.user.id)
            .single();

          if (userError) throw userError;

          const currentLevel = userData?.level || 1;
          const experienceGain = calculateExperienceGain(score, currentLevel);

          // Use RPC to handle score update
          const { data: wasUpdated, error: updateError } = await supabase
            .rpc('update_daily_score_if_better', {
              p_user_id: session.user.id,
              p_score: score,
              p_date: today.toISOString().split('T')[0]
            });

          if (updateError) throw updateError;

          // Only update experience and stats if the score was actually updated
          if (wasUpdated) {
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

            if (statsError) throw statsError;

            const { error: expError } = await supabase
              .rpc('increment_experience', {
                user_id: session.user.id,
                amount: experienceGain
              });

            if (expError) throw expError;
          }
        }

        saveGameStats(score, isDaily);
        onGameComplete();
      } catch (error: any) {
        hasUpdatedRef.current = false;
        
        toast({
          title: "Error Updating Score",
          description: "Failed to update your score. Please try again.",
          variant: "destructive",
        });
      }
    };

    updateScore();
  }, [game.isComplete, game.currentChain.length, game.startWord, session?.user?.id, onGameComplete]);

  return null;
};