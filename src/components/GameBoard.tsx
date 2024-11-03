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
      
      // Recalculate all progresses when removing a word
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
      toast({
        description: "New word pair generated!",
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
        // Instead of showing a toast with the hint, we'll submit it directly
        onWordChange(hint);
        // Submit the form after a short delay to ensure the word is set
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

      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-grow min-h-0 rounded-md border"
        style={{ 
          height: `${maxScrollHeight}px`,
          minHeight: '60px',
          maxHeight: `${maxScrollHeight}px`
        }}
      >
        <div className="space-y-0.5 p-1">
          {game.currentChain.map((word, index) => (
            <Button
              key={`${word}-${index}`}
              variant="ghost"
              className="w-full py-0.5 text-center font-medium transition-colors hover:bg-opacity-10"
              onClick={() => {
                onWordClick(index === editingIndex ? null : index);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              disabled={index === 0 || game.isComplete}
              style={{ 
                opacity: index === 0 ? 1 : undefined,
                pointerEvents: index === 0 ? 'none' : undefined,
                color: THEME_COLORS.TEXT.PRIMARY
              }}
            >
              <WordDisplay 
                word={word} 
                progress={getWordProgress(index)}
                containerWidth={containerWidth} 
              />
            </Button>
          ))}
        </div>
      </ScrollArea>

      {!game.isComplete && (
        <>
          <WordInput
            currentWord={currentWord}
            onWordChange={onWordChange}
            onWordSubmit={onWordSubmit}
            editingIndex={editingIndex}
            isChecking={isChecking}
            onEditCancel={handleBackButton}
            inputRef={inputRef}
          />
          <div className="flex gap-2 mt-2">
            <Button 
              onClick={handleHint}
              variant="outline"
              className="flex-1"
              disabled={isGeneratingHint}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              {isGeneratingHint ? "Finding Hint..." : "Hint"}
            </Button>
            <Button 
              onClick={handleNewWords}
              variant="outline"
              className="flex-1"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              New Words
            </Button>
          </div>
        </>
      )}

      {game.isComplete && (
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-[#FF8B8B] hover:bg-[#FF8B8B]/90 text-white"
          >
            Retry
          </Button>
          <Button 
            onClick={handleShare}
            variant="outline"
            className="w-full"
          >
            <Share className="mr-2 h-4 w-4" />
            Share Result
          </Button>
        </div>
      )}
    </GameContainer>
  );
};

export default GameBoard;