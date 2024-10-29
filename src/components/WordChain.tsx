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
  const getWordColor = async (word: string) => {
    const similarity = await cosineSimilarity(word, targetWord);
    const progress = calculateProgress(similarity);
    
    if (progress < 25) return "bg-blue-100/70 hover:bg-blue-200/70 text-blue-700";
    if (progress < 50) return "bg-violet-100/70 hover:bg-violet-200/70 text-violet-700";
    if (progress < 75) return "bg-rose-100/70 hover:bg-rose-200/70 text-rose-700";
    return "bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-700";
  };

  return (
    <div className="space-y-2">
      {words.map((word, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn(
            "w-full p-3 text-center font-medium border transition-colors",
            index === 0 ? "bg-pink-100/70 text-pink-700 cursor-not-allowed" : getWordColor(word),
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