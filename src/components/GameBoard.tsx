import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import WordDisplay from "./WordDisplay";
import HeaderSection from "./game/HeaderSection";
import WordInput from "./game/WordInput";
import { GameContainer } from "./game/layout/GameContainer";
import { THEME_COLORS } from "@/lib/constants";
import { Share } from "lucide-react";
import { GameBoardProps } from "./game/GameBoardTypes";
import { generateShareText } from "@/lib/utils/share";
import { toast } from "./ui/use-toast";

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
  const [visualViewport, setVisualViewport] = useState<{ height: number; width: number }>({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number>();

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
    const handleResize = () => {
      if (window.visualViewport) {
        const newHeight = window.visualViewport.height;
        const newWidth = window.visualViewport.width;
        console.log('VIEW: Viewport size changed:', { height: newHeight, width: newWidth });
        setVisualViewport({
          height: newHeight,
          width: newWidth,
        });
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      if (scrollTimeoutRef.current) {
        window.cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);

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

  const handleBackButton = () => {
    if (editingIndex !== null) {
      onWordClick(null);
    } else if (game.currentChain.length > 1) {
      const newChain = [...game.currentChain];
      newChain.pop();
      const newProgresses = [...game.wordProgresses];
      newProgresses.pop();
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
        progress={progress}
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
        <WordInput
          currentWord={currentWord}
          onWordChange={onWordChange}
          onWordSubmit={onWordSubmit}
          editingIndex={editingIndex}
          isChecking={isChecking}
          onEditCancel={handleBackButton}
          inputRef={inputRef}
        />
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
