import LetterSquare from "./LetterSquare";

interface WordDisplayProps {
  word: string;
  progress: number;
}

const WordDisplay = ({ word, progress }: WordDisplayProps) => {
  return (
    <div className="flex">
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