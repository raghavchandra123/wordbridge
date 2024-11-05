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

        // Get current experience value
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('experience')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        // Calculate new experience
        const experienceGain = Math.floor(100 / score);
        const newExperience = (currentProfile?.experience || 0) + experienceGain;

        // Update experience
        const { error: expError } = await supabase
          .from('profiles')
          .update({ experience: newExperience })
          .eq('id', session.user.id);

        if (expError) {
          console.error('Error updating experience:', expError);
          toast({
            description: "There was an issue updating your experience points.",
            variant: "destructive",
          });
        }

        // Get current stats
        const { data: currentStats, error: statsError } = await supabase
          .from('user_statistics')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!currentStats) {
          // If no stats exist, create new entry
          const { error: insertError } = await supabase
            .from('user_statistics')
            .insert({
              user_id: session.user.id,
              total_games: 1,
              total_score: score
            });

          if (insertError) {
            console.error('Error creating statistics:', insertError);
            toast({
              description: "There was an issue saving your statistics.",
              variant: "destructive",
            });
          }
        } else {
          // Update existing stats
          const { error: updateError } = await supabase
            .from('user_statistics')
            .update({
              total_games: currentStats.total_games + 1,
              total_score: currentStats.total_score + score
            })
            .eq('user_id', session.user.id);

          if (updateError) {
            console.error('Error updating statistics:', updateError);
            toast({
              description: "There was an issue updating your statistics.",
              variant: "destructive",
            });
          }
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