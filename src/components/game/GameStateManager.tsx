import { useEffect } from 'react';
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
  useSyncGameStats(session?.user?.id);

  useEffect(() => {
    const updateScore = async () => {
      if (!game.isComplete || !session?.user?.id) return;

      const score = game.currentChain.length - 1;
      const isDaily = !game.startWord.includes('-');
      
      try {
        if (isDaily) {
          console.log('🎮 Starting daily score update...');
          const today = startOfDay(toZonedTime(new Date(), 'GMT'));
          console.log('📅 Using date:', today.toISOString());
          
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
          
          console.log('👤 User data:', userData);
          const currentLevel = userData?.level || 1;
          const experienceGain = calculateExperienceGain(score, currentLevel);
          console.log('⭐ Experience to gain:', experienceGain);

          // Update daily score using upsert with onConflict strategy
          console.log('📊 Attempting to update daily score...');
          const { data: scoreData, error: scoreError } = await supabase
            .from('daily_scores')
            .upsert(
              {
                user_id: session.user.id,
                score,
                date: today.toISOString().split('T')[0]
              },
              {
                onConflict: 'user_id,date',
                ignoreDuplicates: false
              }
            )
            .select();

          if (scoreError) {
            console.error('❌ Error updating daily score:', {
              error: scoreError,
              payload: {
                user_id: session.user.id,
                score,
                date: today.toISOString().split('T')[0]
              }
            });
            throw scoreError;
          }
          
          console.log('✅ Daily score updated:', scoreData);

          // Update total games and score
          console.log('📈 Updating user statistics...');
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

          // Update experience points
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
        }

        saveGameStats(score, isDaily);
        onGameComplete();
      } catch (error: any) {
        console.error('❌ Error in updateScore:', {
          error,
          gameState: {
            isComplete: game.isComplete,
            chainLength: game.currentChain.length,
            startWord: game.startWord
          },
          session: {
            userId: session?.user?.id
          }
        });
        
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