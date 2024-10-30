import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { PROGRESS_COLORS } from "@/lib/constants";

interface WordChainProps {
  words: string[];
  targetWord: string;
  onWordClick: (index: number | null) => void;
  selectedWordIndex: number | null;
  isGameComplete: boolean;
}

const WordChain = ({ words, targetWord, onWordClick, selectedWordIndex, isGameComplete }: WordChainProps) => {
  return (
    <div className="space-y-2">
      {words.map((word, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn(
            "w-full p-3 text-center font-medium border transition-colors",
            index === 0 ? "bg-pink-100/70 text-pink-700 cursor-not-allowed" : 
            index === selectedWordIndex ? "bg-violet-100/70 border-violet-500" :
            PROGRESS_COLORS.LOW,
            isGameComplete && "cursor-not-allowed"
          )}
          disabled={index === 0 || isGameComplete}
          onClick={() => onWordClick(index === selectedWordIndex ? null : index)}
        >
          {word}
        </Button>
      ))}
    </div>
  );
};

export default WordChain;