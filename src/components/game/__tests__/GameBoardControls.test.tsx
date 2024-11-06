import { render, fireEvent, screen } from '@testing-library/react';
import { GameBoardControls } from '../GameBoardControls';
import { describe, it, expect, vi } from 'vitest';
import { GameState } from '@/lib/types';

describe('GameBoardControls', () => {
  const mockGame: GameState = {
    startWord: 'test',
    targetWord: 'final',
    currentChain: ['test'],
    wordProgresses: [],
    isComplete: false,
    score: 0
  };

  const defaultProps = {
    game: mockGame,
    currentWord: '',
    onWordChange: vi.fn(),
    onWordSubmit: vi.fn(),
    editingIndex: null,
    isChecking: false,
    handleBackButton: vi.fn(),
    handleHint: vi.fn(),
    handleNewWords: vi.fn(),
    handleShare: vi.fn(),
    isGeneratingHint: false,
    inputRef: { current: null }
  };

  it('renders input and buttons when game is not complete', () => {
    render(<GameBoardControls {...defaultProps} />);
    
    expect(screen.getByText('Hint')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  it('renders share and retry buttons when game is complete', () => {
    const completeGame = { ...mockGame, isComplete: true };
    render(<GameBoardControls {...defaultProps} game={completeGame} />);
    
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls handleHint when hint button is clicked', () => {
    render(<GameBoardControls {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Hint'));
    expect(defaultProps.handleHint).toHaveBeenCalled();
  });

  it('disables hint button when generating hint', () => {
    render(<GameBoardControls {...defaultProps} isGeneratingHint={true} />);
    
    expect(screen.getByText('Finding Hint...')).toBeDisabled();
  });
});