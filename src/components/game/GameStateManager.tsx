import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { logDatabaseOperation } from './stats/StatsLogger';

interface GameStateManagerProps {
  game: GameState;
  onGameComplete: () => void;
}

export const GameStateManager = ({ game, onGameComplete }: GameStateManagerProps) => {
  const { session } = useAuth();
  const hasUpdatedRef = useRef(false);

  useEffect(() => {
    const updateGameStats = async () => {
      if (!game.isComplete || !session?.user?.id || hasUpdatedRef.current) {
        return;
      }

      try {
        hasUpdatedRef.current = true;
        const score = game.currentChain.length - 1;
        const experienceGain = Math.floor((20 - score) * 10);
        
        logDatabaseOperation('Starting Game Stats Update', {
          score,
          seedDate: game.metadata?.seedDate
        });

        // Update total stats
        const { error: statsError } = await supabase
          .from('user_statistics')
          .upsert({
            user_id: session.user.id,
            total_games: supabase.raw('total_games + 1'),
            total_score: supabase.raw(`total_score + ${score}`)
          });

        if (statsError) throw statsError;

        // Update experience points
        const { data: currentExp } = await supabase
          .from('profiles')
          .select('experience')
          .eq('id', session.user.id)
          .single();

        if (currentExp) {
          const { error: expError } = await supabase
            .from('profiles')
            .update({ experience: currentExp.experience + experienceGain })
            .eq('id', session.user.id);

          if (expError) throw expError;
        }

        // Update daily score if it's a daily game
        const today = new Date().toISOString().split('T')[0];
        if (game.metadata?.seedDate === today) {
          const { error: scoreError } = await supabase
            .from('daily_scores')
            .upsert({
              user_id: session.user.id,
              score,
              date: today
            }, {
              onConflict: 'user_id,date'
            });

          if (scoreError) throw scoreError;
        }

        onGameComplete();
      } catch (error) {
        console.error('Error updating game stats:', error);
        toast({
          title: "Error Updating Stats",
          description: "There was an error updating your game statistics.",
          variant: "destructive",
        });
        logDatabaseOperation('Game Stats Update Failed', { error });
      }
    };

    updateGameStats();
  }, [game.isComplete, game.currentChain.length, session?.user?.id, onGameComplete, game.metadata?.seedDate]);

  return null;
};