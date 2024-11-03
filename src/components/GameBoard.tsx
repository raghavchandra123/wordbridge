import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import WordDisplay from "./WordDisplay";
import HeaderSection from "./game/HeaderSection";
import WordInput from "./game/WordInput";
import { GameContainer } from "./game/layout/GameContainer";
import { THEME_COLORS } from "@/lib/constants";
import { Share, Shuffle, Lightbulb } from "lucide-react";
import { GameBoardProps } from "./game/GameBoardTypes";
import { generateShareText } from "@/lib/utils/share";
import { toast } from "./ui/use-toast";
import { loadInitialChunks, startBackgroundLoading } from "@/lib/embeddings/backgroundLoader";
import { useViewport } from "@/hooks/useViewport";
import { useProgressManager } from "./game/ProgressManager";
import { generateHint } from "@/lib/utils/hintGenerator";
import { findRandomWordPair } from "@/lib/embeddings";

// Since this file is too long, let's split it into smaller components
import { GameBoardScrollArea } from "./game/GameBoardScrollArea";
import { GameBoardControls } from "./game/GameBoardControls";

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

  const getWordProgress = (index: number) => {
    if (index === 0) return 0;
    if (index === game.currentChain.length - 1) return progress;
    return game.wordProgresses[index - 1] || 0;
  };

  const handleBackButton = async () => {
    if (editingIndex !== null) {
      onWordClick(null);
    } else if (game.currentChain.length > 1) {
      const newChain = [...game.currentChain];
      newChain.pop();
      
      const newProgresses = await recalculateChainProgress(newChain);
      
      setGame({
        ...game,
        currentChain: newChain,
        wordProgresses: newProgresses,
        score: newChain.length - 1
      });
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleShare = async () => {
    const shareText = generateShareText(game);
    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          description: "Copied to clipboard!",
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast({
        description: "Sharing failed. Please try again",
        variant: "destructive",
      });
    }
  };

  const handleNewWords = async () => {
    try {
      const [startWord, targetWord] = await findRandomWordPair({});
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
      toast({
        description: "Failed to generate new words. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleHint = async () => {
    if (isGeneratingHint) return;
    setIsGeneratingHint(true);

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
        toast({
          description: "Couldn't find a hint at this time. Try a different word!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating hint:', error);
      toast({
        description: "Error generating hint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingHint(false);
    }
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
    </GameContainer>
  );
};

export default GameBoard;