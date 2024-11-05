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
  const gain = Math.round(100 / score / (1 + 0.1 * currentLevel));
  console.log('📊 Experience calculation:', { score, currentLevel, calculatedGain: gain });
  return gain;
};

export const GameStateManager = ({ game, onGameComplete }: GameStateManagerProps) => {
  const { session } = useAuth();
  const hasUpdatedRef = useRef(false);
  useSyncGameStats(session?.user?.id);

  useEffect(() => {
    const updateScore = async () => {
      if (!game.isComplete || !session?.user?.id || hasUpdatedRef.current) {
        console.log('🔍 Update conditions not met:', {
          isComplete: game.isComplete,
          userId: session?.user?.id ? 'exists' : 'missing',
          hasUpdated: hasUpdatedRef.current
        });
        return;
      }

      const score = game.currentChain.length - 1;
      const isDaily = !game.startWord.includes('-');
      
      try {
        console.log('🎮 Starting score update process...', {
          score,
          isDaily,
          userId: session.user.id,
          startWord: game.startWord
        });
        
        hasUpdatedRef.current = true;

        if (isDaily) {
          const today = startOfDay(toZonedTime(new Date(), 'GMT'));
          console.log('📅 Processing daily score for date:', today.toISOString());
          
          // Get current user level for XP calculation
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('level')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('❌ Error fetching user level:', userError);
            throw userError;
          }

          console.log('👤 User data retrieved:', userData);
          const currentLevel = userData?.level || 1;
          const experienceGain = calculateExperienceGain(score, currentLevel);
          console.log('⭐ Experience to gain:', experienceGain);

          // Use RPC to handle score update
          console.log('📊 Attempting to update daily score...', {
            userId: session.user.id,
            score,
            date: today.toISOString().split('T')[0]
          });

          const { data: wasUpdated, error: updateError } = await supabase
            .rpc('update_daily_score_if_better', {
              p_user_id: session.user.id,
              p_score: score,
              p_date: today.toISOString().split('T')[0]
            });

          if (updateError) {
            console.error('❌ Error in update_daily_score_if_better:', updateError);
            throw updateError;
          }

          console.log('✅ Daily score update result:', { wasUpdated });

          // Only update experience and stats if the score was actually updated
          if (wasUpdated) {
            console.log('📈 Score was better, updating statistics...');
            
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
              console.error('❌ Error updating statistics:', statsError);
              throw statsError;
            }

            console.log('🌟 Updating experience points...');
            const { error: expError } = await supabase
              .rpc('increment_experience', {
                user_id: session.user.id,
                amount: experienceGain
              });

            if (expError) {
              console.error('❌ Error updating experience:', expError);
              throw expError;
            }

            console.log('✨ All updates completed successfully!');
          } else {
            console.log('📝 Existing score was better, no updates needed');
          }
        }

        saveGameStats(score, isDaily);
        onGameComplete();
      } catch (error: any) {
        console.error('❌ Error in updateScore:', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorCode: error.code
        });
        
        hasUpdatedRef.current = false;
        
        toast({
          title: "Error Updating Score",
          description: `Failed to update score: ${error.message}. Code: ${error.code}`,
          variant: "destructive",
        });
      }
    };

    updateScore();
  }, [game.isComplete, game.currentChain.length, game.startWord, session?.user?.id, onGameComplete]);

  return null;
};