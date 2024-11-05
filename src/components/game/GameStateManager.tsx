import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { updateDailyScore, updateExperience, updateTotalStats } from './stats/StatsManager';
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
        
        logDatabaseOperation('Starting Game Stats Update', {
          score,
          seedDate: game.metadata?.seedDate
        });

        await updateDailyScore(session.user.id, score, game.metadata?.seedDate);
        await updateExperience(session.user.id, score);
        await updateTotalStats(session.user.id, score);

        onGameComplete();
      } catch (error) {
        logDatabaseOperation('Game Stats Update Failed', { error });
      }
    };

    updateGameStats();
  }, [game.isComplete, game.currentChain.length, session?.user?.id, onGameComplete, game.metadata?.seedDate]);

  return null;
};