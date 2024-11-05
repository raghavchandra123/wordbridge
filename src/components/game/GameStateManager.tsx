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
          // Get today's date in GMT
          const today = startOfDay(toZonedTime(new Date(), 'GMT'));
          
          // First check if a score already exists for today
          const { data: existingScore } = await supabase
            .from('daily_scores')
            .select('score')
            .eq('user_id', session.user.id)
            .eq('date', today.toISOString().split('T')[0])
            .single();

          // Only update if there's no score or if the new score is better
          if (!existingScore || score < existingScore.score) {
            const { error } = await supabase
              .from('daily_scores')
              .upsert({
                user_id: session.user.id,
                score: score,
                date: today.toISOString().split('T')[0]
              }, {
                onConflict: 'user_id,date'
              });

            if (error) throw error;

            // Update experience points only for daily games
            const experienceGain = Math.max(20 - score, 1) * 10; // More points for fewer steps
            const { error: expError } = await supabase
              .from('profiles')
              .update({ 
                experience: supabase.rpc('increment', { x: experienceGain })
              })
              .eq('id', session.user.id);

            if (expError) throw expError;
          }
        }

        // Always update user statistics
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

        saveGameStats(score, isDaily);
        onGameComplete();
      } catch (error: any) {
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
