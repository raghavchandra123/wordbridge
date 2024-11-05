import { useEffect } from 'react';
import { GameState } from '@/lib/types';
import { saveGameStats } from '@/lib/storage/gameStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSyncGameStats } from '@/hooks/useSyncGameStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';
import { addDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface GameStateManagerProps {
  game: GameState;
  onGameComplete: () => void;
}

export const GameStateManager = ({ game, onGameComplete }: GameStateManagerProps) => {
  const { session } = useAuth();
  useSyncGameStats(session?.user?.id);

  useEffect(() => {
    const updateScore = async () => {
      if (!game.isComplete || !session?.user?.id) return;

      const score = game.currentChain.length - 1;
      const isDaily = !game.startWord.includes('-');
      
      try {
        if (isDaily) {
          const today = startOfDay(toZonedTime(new Date(), 'GMT'));
          
          // Use upsert for daily scores
          const { error: scoreError } = await supabase
            .from('daily_scores')
            .upsert({
              user_id: session.user.id,
              score,
              date: today.toISOString().split('T')[0]
            }, {
              onConflict: 'user_id,date'
            });

          if (scoreError) throw scoreError;

          // Update total games and score
          const { error: statsError } = await supabase
            .from('user_statistics')
            .upsert({
              user_id: session.user.id,
              total_games: 1,
              total_score: score
            }, {
              onConflict: 'user_id'
            });

          if (statsError) throw statsError;

          // Update experience points
          const experienceGain = Math.max(20 - score, 1) * 10;
          const { error: expError } = await supabase
            .rpc('increment_experience', {
              user_id: session.user.id,
              amount: experienceGain
            });

          if (expError) throw expError;
        }

        saveGameStats(score, isDaily);
        onGameComplete();
      } catch (error: any) {
        console.error('Error updating score:', error);
        // Only show toast for non-duplicate errors
        if (error.code !== '23505') {
          toast({
            title: "Error",
            description: "Failed to update score. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    updateScore();
  }, [game.isComplete, game.currentChain.length, game.startWord, session?.user?.id, onGameComplete]);

  return null;
};