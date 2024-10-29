import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { cosineSimilarity } from "@/lib/embeddings";
import { calculateProgress } from "@/lib/embeddings/utils";
import { PROGRESS_COLORS } from "@/lib/constants";

interface WordChainProps {
  words: string[];
  targetWord: string;
  onWordClick: (index: number | null) => void;
  selectedWordIndex: number | null;
  isGameComplete: boolean;
}

const WordChain = ({ words, targetWord, onWordClick, selectedWordIndex, isGameComplete }: WordChainProps) => {
  const updateSimilarities = async (word: string, index: number) => {
    if (index > 0) {
      const prevSimilarity = await cosineSimilarity(word, words[index - 1]);
      console.log(`Word "${word}" similarity to previous word "${words[index - 1]}": ${prevSimilarity}`);
    }
    const targetSimilarity = await cosineSimilarity(word, targetWord);
    console.log(`Word "${word}" similarity to target word "${targetWord}": ${targetSimilarity}`);
    return calculateProgress(targetSimilarity);
  };

  return (
    <div className="space-y-2">
      {words.map((word, index) => {
        // Trigger similarity calculations and logging
        if (!isGameComplete) {
          updateSimilarities(word, index);
        }
        
        return (
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
        );
      })}
    </div>
  );
};

export default WordChain;