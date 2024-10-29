import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { cosineSimilarity } from "@/lib/embeddings";
import { calculateProgress } from "@/lib/embeddings/utils";
import { PROGRESS_COLORS } from "@/lib/constants";

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
    
    if (progress < 25) return PROGRESS_COLORS.LOW;
    if (progress < 50) return PROGRESS_COLORS.MEDIUM;
    if (progress < 75) return PROGRESS_COLORS.HIGH;
    return PROGRESS_COLORS.COMPLETE;
  };

  const getSimilarityText = async (currentWord: string, previousWord: string | null) => {
    if (!previousWord) return "";
    const similarity = await cosineSimilarity(currentWord, previousWord);
    return `(${(similarity * 100).toFixed(1)}% similar to previous)`;
  };

  return (
    <div className="space-y-2">
      {words.map(async (word, index) => {
        const similarityText = await getSimilarityText(word, index > 0 ? words[index - 1] : null);
        return (
          <Button
            key={index}
            variant="ghost"
            className={cn(
              "w-full p-3 text-center font-medium border transition-colors flex flex-col gap-1",
              index === 0 ? "bg-pink-100/70 text-pink-700 cursor-not-allowed" : await getWordColor(word),
              isGameComplete && "cursor-not-allowed"
            )}
            disabled={index === 0 || isGameComplete}
            onClick={() => onWordClick(index)}
          >
            <span>{word}</span>
            {similarityText && (
              <span className="text-xs opacity-70">{similarityText}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default WordChain;