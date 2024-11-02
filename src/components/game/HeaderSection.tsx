import { ArrowDown } from "lucide-react";
import WordDisplay from "../WordDisplay";
import { THEME_COLORS } from "@/lib/constants";
import { useEffect, useState } from "react";
import { cosineSimilarity } from "@/lib/embeddings";

interface HeaderSectionProps {
  startWord: string;
  targetWord: string;
  progress: number;
  containerWidth: number;
}

const HeaderSection = ({ startWord, targetWord, progress, containerWidth }: HeaderSectionProps) => {
  const [initialProgress, setInitialProgress] = useState(0);

  useEffect(() => {
    const calculateInitialProgress = async () => {
      const similarity = await cosineSimilarity(startWord, targetWord);
      const calculatedProgress = Math.max(0, Math.min(100, (similarity + 0.2) / 0.45 * 100));
      setInitialProgress(calculatedProgress);
    };
    calculateInitialProgress();
  }, [startWord, targetWord]);

  return (
    <div className="flex-none space-y-0">
      <div className="flex flex-col items-center gap-0">
        <div className="w-full">
          <WordDisplay word={startWord} progress={0} containerWidth={containerWidth} />
        </div>
        <ArrowDown style={{ color: THEME_COLORS.GRADIENT.MID2 }} size={10} />
        <div className="w-full">
          <WordDisplay word={targetWord} progress={100} containerWidth={containerWidth} />
        </div>
      </div>

      <div 
        className="relative w-full h-2 rounded-full overflow-hidden mt-1" 
        style={{ backgroundColor: `${THEME_COLORS.GRADIENT.MID2}33` }}
      >
        <div 
          className="h-full transition-all"
          style={{ 
            width: `${progress || initialProgress}%`,
            background: `linear-gradient(to right, ${THEME_COLORS.START}, ${THEME_COLORS.GRADIENT.MID1}, ${THEME_COLORS.GRADIENT.MID2}, ${THEME_COLORS.END})`
          }}
        />
      </div>
    </div>
  );
};

export default HeaderSection;