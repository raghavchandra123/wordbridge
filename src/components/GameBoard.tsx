import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import WordDisplay from "./WordDisplay";
import HeaderSection from "./game/HeaderSection";
import WordInput from "./game/WordInput";
import { GameContainer } from "./game/layout/GameContainer";
import { GameCard } from "./game/layout/GameCard";
import { THEME_COLORS } from "@/lib/constants";
import { GameState } from "@/lib/types";

interface GameBoardProps {
  game: GameState;
  currentWord: string;
  editingIndex: number | null;
  isChecking: boolean;
  onWordSubmit: (e: React.FormEvent) => void;
  onWordChange: (word: string) => void;
  onWordClick: (index: number | null) => void;
  progress: number;
}

const GameBoard = ({
  game,
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

  // Calculate component heights with reduced spacing
  const totalMargins = 16; // Reduced from 32px to 16px
  const mainHeight = visualViewport.height - totalMargins;
  
  const headerHeight = 120; // Reduced from 150px
  const inputSectionHeight = 100; // Reduced from 120px
  const cardPadding = 16; // Reduced from 24px
  const cardHeaderHeight = 60; // Reduced from 80px
  const containerWidth = containerRef?.offsetWidth ?? 300;
  
  const availableScrollHeight = mainHeight - headerHeight - inputSectionHeight - cardPadding - cardHeaderHeight;
  const maxScrollHeight = Math.min(availableScrollHeight, visualViewport.height * 0.3); // Increased to 30% of viewport

  console.log('VIEW: Size calculations:', {
    visualViewportHeight: visualViewport.height,
    totalMargins,
    mainHeight,
    headerHeight,
    inputSectionHeight,
    cardPadding,
    cardHeaderHeight,
    availableScrollHeight,
    maxScrollHeight,
    containerWidth,
    actualComponentHeights: {
      header: headerHeight,
      input: inputSectionHeight,
      scroll: maxScrollHeight,
      total: headerHeight + inputSectionHeight + maxScrollHeight + cardPadding + cardHeaderHeight
    }
  });

  return (
    <GameContainer mainHeight={mainHeight} ref={setContainerRef}>
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
          onEditCancel={() => {
            onWordClick(null);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          inputRef={inputRef}
        />
      )}
    </GameContainer>
  );
};

export default GameBoard;
