import { useEffect, useState } from "react";
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

interface WordData {
  word: string;
  color: string;
  similarityText: string;
}

const WordChain = ({ words, targetWord, onWordClick, isGameComplete }: WordChainProps) => {
  const [wordData, setWordData] = useState<WordData[]>([]);

  useEffect(() => {
    const updateWordData = async () => {
      const newWordData = await Promise.all(
        words.map(async (word, index) => {
          let color = "bg-pink-100/70 text-pink-700";
          let similarityText = "";

          if (index > 0) {
            const similarity = await cosineSimilarity(word, words[index - 1]);
            similarityText = `(${(similarity * 100).toFixed(1)}% similar to previous)`;
            
            const targetSimilarity = await cosineSimilarity(word, targetWord);
            const progress = calculateProgress(targetSimilarity);
            
            if (progress < 25) color = PROGRESS_COLORS.LOW;
            else if (progress < 50) color = PROGRESS_COLORS.MEDIUM;
            else if (progress < 75) color = PROGRESS_COLORS.HIGH;
            else color = PROGRESS_COLORS.COMPLETE;
          }

          return {
            word,
            color,
            similarityText
          };
        })
      );
      setWordData(newWordData);
    };

    updateWordData();
  }, [words, targetWord]);

  return (
    <div className="space-y-2">
      {wordData.map((data, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn(
            "w-full p-3 text-center font-medium border transition-colors flex flex-col gap-1",
            index === 0 ? "bg-pink-100/70 text-pink-700 cursor-not-allowed" : data.color,
            isGameComplete && "cursor-not-allowed"
          )}
          disabled={index === 0 || isGameComplete}
          onClick={() => onWordClick(index)}
        >
          <span>{data.word}</span>
          {data.similarityText && (
            <span className="text-xs opacity-70">{data.similarityText}</span>
          )}
        </Button>
      ))}
    </div>
  );
};

export default WordChain;