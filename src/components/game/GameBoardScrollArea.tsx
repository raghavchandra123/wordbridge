import { forwardRef } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import WordDisplay from "../WordDisplay";
import { THEME_COLORS } from "@/lib/constants";
import { GameState } from "@/lib/types";

interface GameBoardScrollAreaProps {
  maxScrollHeight: number;
  game: GameState;
  editingIndex: number | null;
  onWordClick: (index: number | null) => void;
  getWordProgress: (index: number) => number;
  containerWidth: number;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const GameBoardScrollArea = forwardRef<HTMLDivElement, GameBoardScrollAreaProps>(
  ({ maxScrollHeight, game, editingIndex, onWordClick, getWordProgress, containerWidth, inputRef }, ref) => {
    return (
      <ScrollArea 
        ref={ref}
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
    );
  }
);

GameBoardScrollArea.displayName = "GameBoardScrollArea";