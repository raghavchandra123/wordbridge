import { ArrowDown } from "lucide-react";
import WordDisplay from "../WordDisplay";
import { THEME_COLORS } from "@/lib/constants";

interface HeaderSectionProps {
  startWord: string;
  targetWord: string;
  progress: number;
  containerWidth: number;
}

const HeaderSection = ({ startWord, targetWord, progress, containerWidth }: HeaderSectionProps) => (
  <div className="flex-none space-y-1">
    <div className="flex flex-col items-center gap-1">
      <div className="w-full">
        <WordDisplay word={startWord} progress={0} containerWidth={containerWidth} />
      </div>
      <ArrowDown style={{ color: THEME_COLORS.GRADIENT.MID2 }} size={16} />
      <div className="w-full">
        <WordDisplay word={targetWord} progress={100} containerWidth={containerWidth} />
      </div>
    </div>

    <div 
      className="relative w-full h-1.5 rounded-full overflow-hidden" 
      style={{ backgroundColor: `${THEME_COLORS.GRADIENT.MID2}33` }}
    >
      <div 
        className="h-full transition-all"
        style={{ 
          width: `${progress}%`,
          background: `linear-gradient(to right, ${THEME_COLORS.START}, ${THEME_COLORS.GRADIENT.MID1}, ${THEME_COLORS.GRADIENT.MID2}, ${THEME_COLORS.END})`
        }}
      />
    </div>
  </div>
);

export default HeaderSection;