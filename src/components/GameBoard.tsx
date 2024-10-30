import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import WordDisplay from "./WordDisplay";
import { GameState } from "@/lib/types";
import { ArrowDown } from "lucide-react";
import { THEME_COLORS } from "@/lib/constants";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

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
  const containerWidth = containerRef?.offsetWidth ?? 300;

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        setVisualViewport({
          height: window.visualViewport.height,
          width: window.visualViewport.width,
        });
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [game.currentChain.length]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord, game.currentChain.length]);

  const getWordProgress = (index: number) => {
    if (index === 0) return 0;
    if (index === game.currentChain.length - 1) return progress;
    return game.wordProgresses[index - 1] || 0;
  };

  const mainHeight = visualViewport.height - 32; // Account for padding
  const headerHeight = 120; // Approximate height for title and progress sections
  const inputSectionHeight = 100; // Height for input and buttons
  const availableScrollHeight = mainHeight - headerHeight - inputSectionHeight;

  return (
    <div 
      className="flex flex-col space-y-2" 
      style={{ height: mainHeight + 'px' }}
      ref={setContainerRef}
    >
      <div className="flex-none space-y-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-full">
            <WordDisplay 
              word={game.startWord} 
              progress={0}
              containerWidth={containerWidth} 
            />
          </div>
          <ArrowDown style={{ color: THEME_COLORS.GRADIENT.MID2 }} size={16} />
          <div className="w-full">
            <WordDisplay 
              word={game.targetWord} 
              progress={100}
              containerWidth={containerWidth} 
            />
          </div>
        </div>

        <div className="relative w-full h-1.5 rounded-full overflow-hidden" 
          style={{ backgroundColor: `${THEME_COLORS.GRADIENT.MID2}33` }}
        >
          <div 
            className="h-full transition-all"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(to right, ${THEME_COLORS.START}, ${THEME_COLORS.GRADIENT.MID1}, ${THEME_COLORS.GRADIENT.MID2}, ${THEME_COLORS.END})`
            }}
          />
        </div>
      </div>

      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-grow min-h-0 rounded-md border"
        style={{ height: `${availableScrollHeight}px` }}
      >
        <div className="space-y-1 p-2">
          {game.currentChain.map((word, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full py-1.5 text-center font-medium transition-colors hover:bg-opacity-10"
              onClick={() => onWordClick(index === editingIndex ? null : index)}
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
        <form onSubmit={onWordSubmit} className="flex-none space-y-1.5">
          <Input
            ref={inputRef}
            value={currentWord}
            onChange={(e) => onWordChange(e.target.value.toLowerCase())}
            placeholder={editingIndex !== null ? `Change word #${editingIndex + 1}` : "Enter a word..."}
            className="text-center text-lg h-10"
            style={{ 
              backgroundColor: `${THEME_COLORS.GRADIENT.MID2}33`,
              borderColor: THEME_COLORS.GRADIENT.MID2
            }}
            readOnly={isChecking}
            inputMode="text"
          />
          <div className="flex gap-1.5">
            <Button 
              type="submit" 
              className="flex-1 h-10 text-white hover:opacity-90"
              style={{ backgroundColor: THEME_COLORS.GRADIENT.MID2 }}
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
            </Button>
            {editingIndex !== null && (
              <Button 
                type="button" 
                variant="outline"
                className="h-10 hover:opacity-90"
                style={{ borderColor: THEME_COLORS.GRADIENT.MID2, color: THEME_COLORS.GRADIENT.MID2 }}
                disabled={isChecking}
                onClick={() => onWordClick(null)}
              >
                Add New Word
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default GameBoard;