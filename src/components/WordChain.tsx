import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { cosineSimilarity, calculateProgress } from "@/lib/embeddings";

interface WordChainProps {
  words: string[];
  targetWord: string;
  onWordClick: (index: number) => void;
  isGameComplete: boolean;
}

const WordChain = ({ words, targetWord, onWordClick, isGameComplete }: WordChainProps) => {
  const getWordColor = (word: string) => {
    const similarity = cosineSimilarity(word, targetWord);
    const progress = calculateProgress(similarity);
    
    // Lighter pastel colors with consistent opacity
    if (progress < 25) return "bg-blue-50 hover:bg-blue-100 text-blue-800";
    if (progress < 50) return "bg-green-50 hover:bg-green-100 text-green-800";
    if (progress < 75) return "bg-yellow-50 hover:bg-yellow-100 text-yellow-800";
    return "bg-red-50 hover:bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-2">
      {words.map((word, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn(
            "w-full p-3 text-center font-medium border transition-colors",
            index === 0 ? "bg-pink-50 text-pink-800 cursor-not-allowed" : getWordColor(word),
            isGameComplete && "cursor-not-allowed"
          )}
          disabled={index === 0 || isGameComplete}
          onClick={() => onWordClick(index)}
        >
          {word}
        </Button>
      ))}
    </div>
  );
};

export default WordChain;