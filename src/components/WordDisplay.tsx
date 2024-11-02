import LetterSquare from "./LetterSquare";

interface WordDisplayProps {
  word: string;
  progress: number;
  containerWidth: number;
}

const WordDisplay = ({ word, progress, containerWidth }: WordDisplayProps) => {
  const padding = 16;
  const gap = 2;
  const letters = word.length;
  const maxSize = 40;
  
  // Calculate the available width for the word
  const availableWidth = containerWidth - padding * 2;
  
  // Calculate the size of each letter square ensuring it fits
  const size = Math.min(
    Math.floor((availableWidth - (letters - 1) * gap) / letters),
    maxSize
  );

  // If the word is too long, reduce the gap between letters
  const adjustedGap = size === maxSize ? gap : Math.max(0, Math.min(gap, (availableWidth - size * letters) / (letters - 1)));

  return (
    <div 
      className="flex justify-center"
      style={{
        gap: `${adjustedGap}px`,
        maxWidth: '100%',
        overflowX: 'hidden'
      }}
    >
      {word.split('').map((letter, index) => (
        <LetterSquare 
          key={`${word}-${index}`}
          letter={letter}
          progress={progress}
          size={size}
        />
      ))}
    </div>
  );
};

export default WordDisplay;