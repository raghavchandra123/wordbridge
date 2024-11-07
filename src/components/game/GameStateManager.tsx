import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { updateGameStats } from './stats/StatsManager';
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
    if (!game.isComplete || hasUpdatedRef.current || !session?.user?.id) {
      return;
    }

    const handleGameComplete = async () => {
      try {
        const score = game.currentChain.length - 1;
        hasUpdatedRef.current = true;
        
        await updateGameStats(
          session.user.id, 
          score,
          game.metadata?.seedDate || new Date().toISOString().split('T')[0]
        );
        
        onGameComplete();
      } catch (error) {
        logDatabaseOperation('Game Stats Update Failed', { error });
        hasUpdatedRef.current = false;
      }
    };

    handleGameComplete();
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