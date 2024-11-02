import { THEME_COLORS } from "@/lib/constants";

interface LetterSquareProps {
  letter: string;
  progress: number;
  size: number;
}

const LetterSquare = ({ letter, progress, size }: LetterSquareProps) => {
  const getColorForProgress = (progress: number) => {
    if (progress <= 33) {
      const ratio = progress / 33;
      return interpolateColor(
        hexToRgb(THEME_COLORS.START),
        hexToRgb(THEME_COLORS.INTERMEDIATE_1),
        ratio
      );
    } else if (progress <= 66) {
      const ratio = (progress - 33) / 33;
      return interpolateColor(
        hexToRgb(THEME_COLORS.INTERMEDIATE_1),
        hexToRgb(THEME_COLORS.INTERMEDIATE_2),
        ratio
      );
    } else {
      const ratio = (progress - 66) / 34;
      return interpolateColor(
        hexToRgb(THEME_COLORS.INTERMEDIATE_2),
        hexToRgb(THEME_COLORS.END),
        ratio
      );
    }
  };
  
  const color = getColorForProgress(progress);
  
  // Calculate font size based on square size, with a minimum of 10px
  const fontSize = Math.max(Math.floor(size * 0.5), 10);
  
  return (
    <div 
      className="flex items-center justify-center font-bold rounded-lg transition-colors shrink-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `2px solid ${THEME_COLORS.BORDER}`,
        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`,
        color: THEME_COLORS.TEXT.PRIMARY,
        fontSize: `${fontSize}px`,
      }}
    >
      {letter.toUpperCase()}
    </div>
  );
};

// Helper functions for color interpolation
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const interpolateColor = (
  start: { r: number, g: number, b: number },
  end: { r: number, g: number, b: number },
  progress: number
) => {
  return {
    r: Math.round(start.r + (end.r - start.r) * progress),
    g: Math.round(start.g + (end.g - start.g) * progress),
    b: Math.round(start.b + (end.b - start.b) * progress)
  };
};

export default LetterSquare;