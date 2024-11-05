import { useEffect } from 'react';
import { GameState } from '@/lib/types';
import { saveGameStats } from '@/lib/storage/gameStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSyncGameStats } from '@/hooks/useSyncGameStats';
import { supabase } from '@/integrations/supabase/client';

interface GameStateManagerProps {
  game: GameState;
  onGameComplete: () => void;
}

export const GameStateManager = ({ game, onGameComplete }: GameStateManagerProps) => {
  const { session } = useAuth();
  useSyncGameStats(session?.user?.id);

  useEffect(() => {
    if (game.isComplete) {
      const score = game.currentChain.length - 1;
      const isDaily = !game.startWord.includes('-'); // Daily games don't have custom words
      saveGameStats(score, isDaily);
      onGameComplete();
    }
  }, [game.isComplete, game.currentChain.length, game.startWord, onGameComplete]);

  return null;
};