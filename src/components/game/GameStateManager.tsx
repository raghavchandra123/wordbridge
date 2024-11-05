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
        
        // For daily games, update the daily score
        if (isDaily) {
          await updateDailyScore(session.user.id, score);
        }

        // Update experience points
        const experienceGain = Math.floor(100 / score);
        const { error: expError } = await supabase
          .from('profiles')
          .update({ experience: supabase.rpc('increment', { x: experienceGain }) })
          .eq('id', session.user.id);

        if (expError) {
          console.error('Error updating experience:', expError);
          toast({
            description: "There was an issue updating your experience points.",
            variant: "destructive",
          });
        }

        // Update total games and score for ALL games
        const { data: currentStats, error: fetchError } = await supabase
          .from('user_statistics')
          .select('total_games, total_score')
          .eq('user_id', session.user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching statistics:', fetchError);
          return;
        }

        const { error: statsError } = await supabase
          .from('user_statistics')
          .upsert({
            user_id: session.user.id,
            total_games: (currentStats?.total_games || 0) + 1,
            total_score: (currentStats?.total_score || 0) + score
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

        // Save local stats
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