import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { GameContainer } from "./game/layout/GameContainer";
import { GameBoardProps } from "./game/GameBoardTypes";
import { generateShareText } from "@/lib/utils/share";
import { toast } from "./ui/use-toast";
import { useViewport } from "@/hooks/useViewport";
import { useProgressManager } from "./game/ProgressManager";
import { generateHint } from "@/lib/utils/hintGenerator";
import { findRandomWordPair, loadEmbeddings } from "@/lib/embeddings";
import { GameBoardScrollArea } from "./game/GameBoardScrollArea";
import { GameBoardControls } from "./game/GameBoardControls";
import { GameControlButtons } from "./game/GameControlButtons";
import { useDynamicDifficulty } from "@/hooks/useDynamicDifficulty";
import { GameStateManager } from "./game/GameStateManager";
import { handleToast } from "@/lib/utils/toastManager";
import { GameBoardHeader } from "./game/layout/GameBoardHeader";
import { GameBoardInput } from "./game/layout/GameBoardInput";

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
  const [showEndGame, setShowEndGame] = useState(false);
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

  useEffect(() => {
    const initializeEmbeddings = async () => {
      try {
        await loadEmbeddings();
      } catch (error) {
        console.error('Failed to load embeddings:', error);
        handleToast('Failed to load game data', 'destructive');
      }
    };

    initializeEmbeddings();
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

  const handleRetry = () => {
    onNewGameWithoutCompletion();
    setGame({
      ...game,
      currentChain: [game.startWord],
      wordProgresses: [],
      isComplete: false,
      score: 0
    });
  };

  const handleBackButton = () => {
    if (editingIndex !== null) {
      onWordClick(null);
    } else if (game.currentChain.length > 1) {
      const newChain = [...game.currentChain];
      newChain.pop();
      setGame({
        ...game,
        currentChain: newChain,
        score: newChain.length - 1
      });
    }
  };

  const handleShare = async () => {
    const shareText = generateShareText(game);
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        handleToast("Copied to clipboard!");
      }
    } catch (err) {
      console.error('Share failed:', err);
      handleToast("Sharing failed. Please try again", "destructive");
    }
  };

  const handleNewWords = async () => {
    if (!game.isComplete) {
      onNewGameWithoutCompletion();
    }
    try {
      const [startWord, targetWord] = await findRandomWordPair({
        minThreshold,
        maxThreshold
      });
      setGame({
        startWord,
        targetWord,
        currentChain: [startWord],
        wordProgresses: [],
        isComplete: false,
        score: 0
      });
    } catch (err) {
      console.error('Failed to generate new words:', err);
      handleToast("Failed to generate new words. Please try again.", "destructive");
    }
  };

  const handleHint = async () => {
    if (isGeneratingHint) return;
    setIsGeneratingHint(true);
    onHintUsed();

    try {
      const previousWord = game.currentChain[game.currentChain.length - 1];
      const currentProgress = game.wordProgresses[game.wordProgresses.length - 1] || 0;

      const hint = await generateHint(
        previousWord,
        game.targetWord,
        currentProgress,
        game.currentChain
      );

      if (hint) {
        onWordChange(hint);
        setTimeout(() => {
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }, 100);
      } else {
        handleToast("Couldn't find a hint at this time. Try a different word!", "destructive");
      }
    } catch (error) {
      console.error('Error generating hint:', error);
      handleToast("Error generating hint. Please try again.", "destructive");
    } finally {
      setIsGeneratingHint(false);
    }
  };

  const headerHeight = 120;
  const inputSectionHeight = game.isComplete ? 0 : 60;
  const completionButtonsHeight = game.isComplete ? 120 : 0;
  const cardPadding = 16;
  const cardHeaderHeight = 60;

  const availableScrollHeight = visualViewport.height - headerHeight - inputSectionHeight - cardPadding - cardHeaderHeight - completionButtonsHeight;
  const maxScrollHeight = Math.min(availableScrollHeight, visualViewport.height * 0.4);

  return (
    <GameContainer mainHeight={visualViewport.height} ref={setContainerRef}>
      <GameStateManager game={game} onGameComplete={() => setShowEndGame(true)} />
      
      <GameBoardHeader
        startWord={game.startWord}
        targetWord={game.targetWord}
        progress={game.wordProgresses[game.wordProgresses.length - 1] || 0}
        containerWidth={containerRef?.offsetWidth ?? 300}
      />

      <GameBoardScrollArea
        ref={scrollAreaRef}
        maxScrollHeight={maxScrollHeight}
        game={game}
        editingIndex={editingIndex}
        onWordClick={onWordClick}
        getWordProgress={(index) => 
          index === 0 ? 0 : 
          index === game.currentChain.length - 1 ? progress : 
          game.wordProgresses[index - 1] || 0
        }
        containerWidth={containerRef?.offsetWidth ?? 300}
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
        <GameBoardInput
          currentWord={currentWord}
          onWordChange={onWordChange}
          onWordSubmit={onWordSubmit}
          editingIndex={editingIndex}
          isChecking={isChecking}
          onEditCancel={handleBackButton}
          inputRef={inputRef}
        />
      )}
    </GameContainer>
  );
};

export default GameBoard;
