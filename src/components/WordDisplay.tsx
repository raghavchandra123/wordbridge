import LetterSquare from "./LetterSquare";

interface WordDisplayProps {
  word: string;
  progress: number;
}

const WordDisplay = ({ word, progress }: WordDisplayProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-0.5 max-w-[300px]">
      {word.split('').map((letter, index) => (
        <LetterSquare 
          key={`${word}-${index}`}
          letter={letter}
          progress={progress}
        />
      ))}
    </div>
  );
};

export default WordDisplay;