import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { cosineSimilarity } from "@/lib/embeddings/loader";

interface WordChainProps {
  words: string[];
  targetWord: string;
  onWordClick: (index: number) => void;
  isGameComplete: boolean;
}

const WordChain = ({ words, targetWord, onWordClick, isGameComplete }: WordChainProps) => {
  const getWordColor = async (word: string) => {
    const similarity = await cosineSimilarity(word, targetWord);
    const progress = calculateProgress(similarity);
    
    // Lighter pastel colors with consistent opacity
    if (progress < 25) return "bg-blue-50 hover:bg-blue-100 text-blue-600";
    if (progress < 50) return "bg-violet-50 hover:bg-violet-100 text-violet-600";
    if (progress < 75) return "bg-rose-50 hover:bg-rose-100 text-rose-600";
    return "bg-emerald-50 hover:bg-emerald-100 text-emerald-600";
  };

  return (
    <div className="space-y-2">
      {words.map((word, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn(
            "w-full p-3 text-center font-medium border transition-colors",
            index === 0 ? "bg-pink-50 text-pink-600 cursor-not-allowed" : getWordColor(word),
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