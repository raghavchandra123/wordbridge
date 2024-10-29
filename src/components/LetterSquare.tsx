import { THEME_COLORS } from "@/lib/constants/colors";

interface LetterSquareProps {
  letter: string;
  progress: number;
}

const LetterSquare = ({ letter, progress }: LetterSquareProps) => {
  const borderColor = `rgb(${Math.round(255 * (1 - progress/100))}, ${Math.round(139 * (1 - progress/100))}, ${Math.round(139 * (1 - progress/100))})`;
  
  return (
    <div 
      className="w-12 h-12 flex items-center justify-center text-2xl font-bold rounded-lg m-0.5"
      style={{
        border: `2px solid ${borderColor}`,
        color: THEME_COLORS.TEXT.PRIMARY,
      }}
    >
      {letter.toUpperCase()}
    </div>
  );
};

export default LetterSquare;