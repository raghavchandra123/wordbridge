import { useState, useRef, useEffect } from "react";
import WordDisplay from "./WordDisplay";
import HeaderSection from "./game/HeaderSection";
import { GameContainer } from "./game/layout/GameContainer";
import { GameBoardProps } from "./game/GameBoardTypes";
import { loadInitialChunks, startBackgroundLoading } from "@/lib/embeddings/backgroundLoader";
import { useViewport } from "@/hooks/useViewport";
import { useProgressManager } from "./game/ProgressManager";
import { GameBoardScrollArea } from "./game/GameBoardScrollArea";
import { GameBoardControls } from "./game/GameBoardControls";
import { GameControlButtons } from "./game/GameControlButtons";
import { useDynamicDifficulty } from "@/hooks/useDynamicDifficulty";
import { useGameBoardHandlers } from "./game/GameBoardHandlers";

const GameBoard = ({
  game,
  setGame,
  currentWord,
  editingIndex,
  isChecking,
  onWordSubmit,
  onWordChange,
  onWordClick,
  progress,
}: GameBoardProps) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const visualViewport = useViewport();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number>();
  const { updateProgress, recalculateChainProgress } = useProgressManager(game, setGame);
  const {
    minThreshold,
    maxThreshold,
    onHintUsed,
    onNewGameWithoutCompletion,
    onWordRejected,
    onGameCompleted,
  } = useDynamicDifficulty();

  const {
    handleRetry,
    handleBackButton,
    handleShare,
    handleNewWords,
    handleHint
  } = useGameBoardHandlers(
    game,
    setGame,
    onWordClick,
    editingIndex,
    onWordChange,
    onWordRejected,
    onHintUsed,
    onNewGameWithoutCompletion,
    minThreshold,
    maxThreshold,
    recalculateChainProgress
  );

  // Background loading effect
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    const initializeBackgroundLoading = async () => {
      intervalId = await startBackgroundLoading();
      await loadInitialChunks([0, 1]);
    };
    
    initializeBackgroundLoading();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const scrollToBottom = () => {
    if (scrollTimeoutRef.current) {
      window.cancelAnimationFrame(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.requestAnimationFrame(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    });
  };

  useEffect(() => {
    if (inputRef.current && !game.isComplete) {
      inputRef.current.focus();
    }
  }, [currentWord, isChecking, game.isComplete, editingIndex]);

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [game.currentChain.length]);

  useEffect(() => {
    if (game.isComplete) {
      onGameCompleted();
    }
  }, [game.isComplete, onGameCompleted]);

  const getWordProgress = (index: number) => {
    if (index === 0) return 0;
    if (index === game.currentChain.length - 1) return progress;
    return game.wordProgresses[index - 1] || 0;
  };

  const headerHeight = 120;
  const inputSectionHeight = game.isComplete ? 0 : 60;
  const completionButtonsHeight = game.isComplete ? 120 : 0;
  const cardPadding = 16;
  const cardHeaderHeight = 60;
  const containerWidth = containerRef?.offsetWidth ?? 300;
  
  const availableScrollHeight = visualViewport.height - headerHeight - inputSectionHeight - cardPadding - cardHeaderHeight - completionButtonsHeight;
  const maxScrollHeight = Math.min(availableScrollHeight, visualViewport.height * 0.4);

  return (
    <GameContainer mainHeight={visualViewport.height} ref={setContainerRef}>
      <HeaderSection 
        startWord={game.startWord}
        targetWord={game.targetWord}
        progress={game.wordProgresses[game.wordProgresses.length - 1] || 0}
        containerWidth={containerWidth}
      />

      <GameBoardScrollArea
        ref={scrollAreaRef}
        maxScrollHeight={maxScrollHeight}
        game={game}
        editingIndex={editingIndex}
        onWordClick={onWordClick}
        getWordProgress={getWordProgress}
        containerWidth={containerWidth}
        inputRef={inputRef}
      />

      {game.isComplete ? (
        <GameControlButtons
          game={game}
          handleShare={handleShare}
          handleRetry={handleRetry}
          handleNewWords={handleNewWords}
        />
      ) : (
        <GameBoardControls
          game={game}
          currentWord={currentWord}
          onWordChange={onWordChange}
          onWordSubmit={onWordSubmit}
          editingIndex={editingIndex}
          isChecking={isChecking}
          handleBackButton={handleBackButton}
          handleHint={handleHint}
          handleNewWords={handleNewWords}
          handleShare={handleShare}
          isGeneratingHint={isGeneratingHint}
          inputRef={inputRef}
        />
      )}
    </GameContainer>
  );
};

export default GameBoard;