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
    // Only run this effect when game completion status changes
    if (previousGameStateRef.current?.isComplete === game.isComplete) {
      return;
    }

    previousGameStateRef.current = game;

    const updateGameStats = async () => {
      if (!game.isComplete || !session?.user?.id) {
        if (game.isComplete === false) {
          logDatabaseOperation('Game Stats Update Skipped', {
            reason: 'Game in progress'
          });
        }
        return;
      }

      if (hasUpdatedRef.current) {
        logDatabaseOperation('Game Stats Update Skipped', {
          reason: 'Already updated',
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
          seedDate: game.metadata?.seedDate
        });

        // Set the flag before making any updates to prevent race conditions
        hasUpdatedRef.current = true;

        // Execute updates in sequence
        if (game.metadata?.seedDate) {
          await updateDailyScore(session.user.id, score, game.metadata.seedDate);
        }

        await updateExperience(session.user.id, score);
        await updateTotalStats(session.user.id, score);

        // Small delay to ensure database updates are complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        onGameComplete();
      } catch (error) {
        logDatabaseOperation('Game Stats Update Failed', { error });
        // Reset the flag if update fails so it can be retried
        hasUpdatedRef.current = false;
      }
    };

    updateGameStats();
  }, [game.isComplete, session?.user?.id, onGameComplete]);

  // Reset hasUpdated when starting a new game
  useEffect(() => {
    if (previousGameStateRef.current?.startWord !== game.startWord || 
        previousGameStateRef.current?.targetWord !== game.targetWord) {
      hasUpdatedRef.current = false;
      previousGameStateRef.current = game;
    }
  }, [game.startWord, game.targetWord]);

  return null;
};