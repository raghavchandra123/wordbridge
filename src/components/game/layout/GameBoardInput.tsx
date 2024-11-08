import React from "react";
import WordInput from "../WordInput";

interface GameBoardInputProps {
  currentWord: string;
  onWordChange: (word: string) => void;
  onWordSubmit: (e: React.FormEvent) => void;
  isChecking: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const GameBoardInput = ({
  currentWord,
  onWordChange,
  onWordSubmit,
  isChecking,
  inputRef
}: GameBoardInputProps) => {
  return (
    <WordInput
      value={currentWord}
      onChange={onWordChange}
      onSubmit={onWordSubmit}
      isChecking={isChecking}
      inputRef={inputRef}
    />
  );
};