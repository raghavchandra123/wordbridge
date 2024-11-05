import { useEffect } from 'react';
import { GameState } from '@/lib/types';
import { saveGameStats } from '@/lib/storage/gameStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSyncGameStats } from '@/hooks/useSyncGameStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '../ui/use-toast';

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
        // First check if a score already exists for today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingScore } = await supabase
          .from('daily_scores')
          .select('score')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single();

        // Only update if there's no score or if the new score is better
        if (!existingScore || score < existingScore.score) {
          const { error } = await supabase
            .from('daily_scores')
            .upsert({
              user_id: session.user.id,
              score: score,
              date: today
            });

          if (error) throw error;

          // Update experience points
          const experienceGain = Math.max(20 - score, 1) * 10; // More points for fewer steps
          const { error: expError } = await supabase
            .from('profiles')
            .update({ 
              experience: supabase.rpc('increment', { x: experienceGain })
            })
            .eq('id', session.user.id);

          if (expError) throw expError;
        }

        saveGameStats(score, isDaily);
        onGameComplete();
      } catch (error) {
        console.error('Error updating score:', error);
        toast({
          title: "Error",
          description: "Failed to update score. Please try again.",
          variant: "destructive",
        });
      }
    };

    updateScore();
  }, [game.isComplete, game.currentChain.length, game.startWord, session?.user?.id, onGameComplete]);

  return null;
};