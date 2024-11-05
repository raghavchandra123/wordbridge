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
      // Only proceed if game is complete, user is logged in, and we haven't updated yet
      if (!game.isComplete || !session?.user?.id || hasUpdatedRef.current) return;

      const score = game.currentChain.length - 1;
      const isDaily = !game.startWord.includes('-');
      
      try {
        hasUpdatedRef.current = true; // Mark as updated immediately to prevent duplicate calls

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

          // Update daily score using upsert
          const { error: scoreError } = await supabase
            .from('daily_scores')
            .upsert(
              {
                user_id: session.user.id,
                score,
                date: today.toISOString().split('T')[0]
              },
              {
                onConflict: 'user_id,date',
                ignoreDuplicates: true // This ensures we don't update if entry exists
              }
            );

          if (scoreError) throw scoreError;

          // Update total games and score
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

          // Update experience points
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
        console.error('Error in updateScore:', error);
        
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