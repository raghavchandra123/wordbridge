import { THEME_COLORS } from "@/lib/constants";

interface LetterSquareProps {
  letter: string;
  progress: number;
  size: number;
}

const LetterSquare = ({ letter, progress, size }: LetterSquareProps) => {
  const startColor = THEME_COLORS.START;
  const endColor = THEME_COLORS.END;
  
  const startRGB = hexToRgb(startColor);
  const endRGB = hexToRgb(endColor);
  
  const interpolatedColor = interpolateColor(startRGB, endRGB, progress / 100);
  const borderColor = endColor;
  
  return (
    <div 
      className="flex items-center justify-center font-bold rounded-lg m-0.5 transition-colors"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `2px solid ${borderColor}`,
        backgroundColor: `rgba(${interpolatedColor.r}, ${interpolatedColor.g}, ${interpolatedColor.b}, 1.0)`,
        color: THEME_COLORS.TEXT.PRIMARY,
        fontSize: `${Math.max(size * 0.4, 12)}px`,
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
