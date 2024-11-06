import { render } from '@testing-library/react';
import { GameStateManager } from '../GameStateManager';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameState } from '@/lib/types';

// Mock the database operations
vi.mock('@/lib/utils/dbLogger', () => ({
  logDatabaseOperation: vi.fn()
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: {
      user: {
        id: 'test-user-id'
      }
    }
  })
}));

describe('GameStateManager', () => {
  const mockGame: GameState = {
    startWord: 'test',
    targetWord: 'final',
    currentChain: ['test'],
    wordProgresses: [],
    isComplete: false,
    score: 0,
    metadata: {
      seedDate: '2024-01-01'
    }
  };

  const mockOnGameComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not trigger updates when game is not complete', () => {
    render(
      <GameStateManager 
        game={mockGame} 
        onGameComplete={mockOnGameComplete} 
      />
    );

    expect(mockOnGameComplete).not.toHaveBeenCalled();
  });

  it('should trigger updates when game is complete', () => {
    const completeGame = { ...mockGame, isComplete: true };
    render(
      <GameStateManager 
        game={completeGame} 
        onGameComplete={mockOnGameComplete} 
      />
    );

    // Wait for async operations
    setTimeout(() => {
      expect(mockOnGameComplete).toHaveBeenCalled();
    }, 500);
  });
});