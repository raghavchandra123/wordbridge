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
        // First ensure user statistics exist
        const { data: existingStats, error: statsCheckError } = await supabase
          .from('user_statistics')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (statsCheckError && statsCheckError.code !== 'PGRST116') {
          throw statsCheckError;
        }

        if (!existingStats) {
          const { error: createStatsError } = await supabase
            .from('user_statistics')
            .insert({
              user_id: session.user.id,
              total_games: 1,
              total_score: score
            });

          if (createStatsError) throw createStatsError;
        } else {
          const { error: updateStatsError } = await supabase
            .from('user_statistics')
            .update({
              total_games: supabase.rpc('increment', { x: 1 }),
              total_score: existingStats.total_score + score
            })
            .eq('user_id', session.user.id);

          if (updateStatsError) throw updateStatsError;
        }
        
        if (isDaily) {
          const today = startOfDay(toZonedTime(new Date(), 'GMT'));
          
          // Check for existing daily score
          const { data: existingScore, error: scoreCheckError } = await supabase
            .from('daily_scores')
            .select('score')
            .eq('user_id', session.user.id)
            .eq('date', today.toISOString().split('T')[0])
            .single();

          if (scoreCheckError && scoreCheckError.code !== 'PGRST116') {
            throw scoreCheckError;
          }

          // Only update if there's no score or if the new score is better
          if (!existingScore || score < existingScore.score) {
            const { error: scoreError } = await supabase
              .from('daily_scores')
              .upsert({
                user_id: session.user.id,
                score: score,
                date: today.toISOString().split('T')[0]
              }, {
                onConflict: 'user_id,date'
              });

            if (scoreError) throw scoreError;

            // Update experience points only for daily games
            const experienceGain = Math.max(20 - score, 1) * 10;
            const { error: expError } = await supabase
              .from('profiles')
              .update({ 
                experience: supabase.rpc('increment', { x: experienceGain })
              })
              .eq('id', session.user.id);

            if (expError) throw expError;
          }
        }

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