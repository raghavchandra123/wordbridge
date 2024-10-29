import { useState, useEffect } from "react";
import { GameState } from "@/lib/types";
import { loadEmbeddings, findRandomWordPair } from "@/lib/embeddings";
import { WordDictionary } from "@/lib/embeddings/types";

export const useGameInitialization = () => {
  const [game, setGame] = useState<GameState>({
    startWord: "",
    targetWord: "",
    currentChain: [],
    isComplete: false,
    score: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initGame = async () => {
      try {
        await loadEmbeddings();
        const emptyDict: WordDictionary = {};
        const [start, target] = await findRandomWordPair(emptyDict);
        setGame({
          startWord: start,
          targetWord: target,
          currentChain: [start],
          isComplete: false,
          score: 0,
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Game initialization failed:', error);
      }
    };

    initGame();
  }, []);

  return { game, setGame, isLoading };
};