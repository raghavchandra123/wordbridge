import React from "react";
import HeaderSection from "../HeaderSection";

interface GameBoardHeaderProps {
  startWord: string;
  targetWord: string;
  progress: number;
  containerWidth: number;
}

export const GameBoardHeader = ({ 
  startWord, 
  targetWord, 
  progress, 
  containerWidth 
}: GameBoardHeaderProps) => {
  return (
    <HeaderSection
      startWord={startWord}
      targetWord={targetWord}
      progress={progress}
      containerWidth={containerWidth}
    />
  );
};