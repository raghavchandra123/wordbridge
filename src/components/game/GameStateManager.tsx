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
    // Only run this effect when the game is completed for the first time
    if (!game.isComplete || hasUpdatedRef.current || !session?.user?.id) {
      return;
    }

    const updateGameStats = async () => {
      try {
        const score = game.currentChain.length - 1;
        hasUpdatedRef.current = true;
        
        if (game.metadata?.seedDate) {
          await updateDailyScore(session.user.id, score, game.metadata.seedDate);
        }
        await updateExperience(session.user.id, score);
        await updateTotalStats(session.user.id, score);
        
        onGameComplete();
      } catch (error) {
        logDatabaseOperation('Game Stats Update Failed', { error });
        hasUpdatedRef.current = false;
      }
    };

    updateGameStats();
  }, [game.isComplete, session?.user?.id, onGameComplete, game.metadata?.seedDate, game.currentChain.length]);

  // Reset hasUpdated when starting a new game
  useEffect(() => {
    if (previousGameStateRef.current?.startWord !== game.startWord || 
        previousGameStateRef.current?.targetWord !== game.targetWord) {
      hasUpdatedRef.current = false;
    }
    previousGameStateRef.current = game;
  }, [game.startWord, game.targetWord]);

  return null;
};