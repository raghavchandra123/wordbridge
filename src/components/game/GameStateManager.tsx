import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { updateDailyScore, updateExperience, updateTotalStats } from './stats/StatsManager';
import { logDatabaseOperation } from '@/lib/utils/dbLogger';

interface GameStateManagerProps {
  game: GameState;
  onGameComplete: () => void;
}

export const GameStateManager = ({ game, onGameComplete }: GameStateManagerProps) => {
  const { session } = useAuth();
  const hasUpdatedRef = useRef(false);
  const previousGameStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    // Reset hasUpdated when starting a new game
    if (previousGameStateRef.current?.startWord !== game.startWord || 
        previousGameStateRef.current?.targetWord !== game.targetWord) {
      hasUpdatedRef.current = false;
      previousGameStateRef.current = game;
    }

    const updateGameStats = async () => {
      if (!game.isComplete || !session?.user?.id) {
        logDatabaseOperation('Skipping Game Stats Update', {
          reason: !game.isComplete ? 'Game not complete' : 'No user session',
          isComplete: game.isComplete,
          userId: session?.user?.id
        });
        return;
      }

      if (hasUpdatedRef.current) {
        logDatabaseOperation('Skipping Game Stats Update', {
          reason: 'Already updated',
          hasUpdated: hasUpdatedRef.current,
          gameState: {
            startWord: game.startWord,
            targetWord: game.targetWord,
            chainLength: game.currentChain.length
          }
        });
        return;
      }

      try {
        const score = game.currentChain.length - 1;
        
        logDatabaseOperation('Starting Game Stats Update', {
          score,
          seedDate: game.metadata?.seedDate,
          currentChain: game.currentChain
        });

        // Set the flag before making any updates to prevent race conditions
        hasUpdatedRef.current = true;

        if (game.metadata?.seedDate) {
          await updateDailyScore(session.user.id, score, game.metadata.seedDate);
        } else {
          logDatabaseOperation('Skipping Daily Score Update', {
            reason: 'Not a daily game',
            seedDate: game.metadata?.seedDate
          });
        }

        await updateExperience(session.user.id, score);
        await updateTotalStats(session.user.id, score);

        onGameComplete();
      } catch (error) {
        logDatabaseOperation('Game Stats Update Failed', { error });
        // Reset the flag if update fails so it can be retried
        hasUpdatedRef.current = false;
      }
    };

    updateGameStats();
  }, [game.isComplete, game.currentChain.length, session?.user?.id, onGameComplete, game]);

  return null;
};