import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import WordDisplay from "./WordDisplay";
import HeaderSection from "./game/HeaderSection";
import WordInput from "./game/WordInput";
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
  const containerWidth = containerRef?.offsetWidth ?? 300;

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

  // Calculate component heights
  const safeAreaInsets = 'env(safe-area-inset-bottom)';
  const totalMargins = 32; // 2rem (32px) total padding from root container
  const mainHeight = visualViewport.height - totalMargins;
  
  // Component heights
  const headerHeight = 60; // Fixed height for header section
  const inputSectionHeight = 70; // Fixed height for input section
  const cardPadding = 24; // 1.5rem padding from Card component
  const cardHeaderHeight = 100; // Estimated height for card title and description
  
  // Calculate available height for scroll area
  const availableScrollHeight = mainHeight - headerHeight - inputSectionHeight - cardPadding - cardHeaderHeight;
  const maxScrollHeight = Math.min(availableScrollHeight, visualViewport.height * 0.25);

  // Debug logging
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
    containerWidth
  });

  return (
    <div 
      className="flex flex-col space-y-2 mx-4 pb-safe" 
      style={{ 
        height: mainHeight + 'px',
        maxHeight: '100%',
        paddingBottom: `calc(${safeAreaInsets} + 1rem)`
      }}
      ref={setContainerRef}
    >
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
          minHeight: '60px'
        }}
      >
        <div className="space-y-1 p-2">
          {game.currentChain.map((word, index) => (
            <Button
              key={`${word}-${index}`}
              variant="ghost"
              className="w-full py-1 text-center font-medium transition-colors hover:bg-opacity-10"
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
    </div>
  );
};

export default GameBoard;