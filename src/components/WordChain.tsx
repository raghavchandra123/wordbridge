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
    
    // Pastel color gradient from cool to warm
    if (progress < 25) return "bg-blue-200/30 hover:bg-blue-200/40";
    if (progress < 50) return "bg-green-200/30 hover:bg-green-200/40";
    if (progress < 75) return "bg-yellow-200/30 hover:bg-yellow-200/40";
    return "bg-red-200/30 hover:bg-red-200/40";
  };

  return (
    <div className="space-y-2">
      {words.map((word, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn(
            "w-full p-3 text-center font-medium border transition-colors",
            index === 0 ? "bg-pink-900/20 cursor-not-allowed" : getWordColor(word),
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