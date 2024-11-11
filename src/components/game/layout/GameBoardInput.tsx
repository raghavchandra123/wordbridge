import React from "react";
import WordInput from "../WordInput";

interface GameBoardInputProps {
  currentWord: string;
  onWordChange: (word: string) => void;
  onWordSubmit: (e: React.FormEvent) => void;
  isChecking: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  editingIndex: number | null;
  onEditCancel: () => void;
}

export const GameBoardInput = ({
  currentWord,
  onWordChange,
  onWordSubmit,
  isChecking,
  inputRef,
  editingIndex,
  onEditCancel
}: GameBoardInputProps) => {
  return (
    <WordInput
      currentWord={currentWord}
      onWordChange={onWordChange}
      onWordSubmit={onWordSubmit}
      editingIndex={editingIndex}
      isChecking={isChecking}
      onEditCancel={onEditCancel}
      inputRef={inputRef}
    />
  );
};