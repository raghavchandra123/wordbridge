interface WordDisplayProps {
  word: string;
  progress: number;
  containerWidth: number;
}

const WordDisplay = ({ word, progress, containerWidth }: WordDisplayProps) => {
  const padding = 16; // Account for container padding
  const gap = 2; // Gap between squares
  const letters = word.length;
  const maxSize = 40; // Maximum square size
  const size = Math.min(Math.floor((containerWidth - padding * 2 - (letters - 1) * gap) / letters), maxSize);

  return (
    <div className="flex justify-center gap-0.5">
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