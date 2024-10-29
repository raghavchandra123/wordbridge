import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  loadEmbeddings,
  findRandomWordPair,
  cosineSimilarity,
  calculateProgress,
} from "@/lib/embeddings";
import { saveHighScore } from "@/lib/storage";
import { GameState } from "@/lib/types";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentWord, setCurrentWord] = useState("");
  const [game, setGame] = useState<GameState>({
    startWord: "",
    targetWord: "",
    currentChain: [],
    isComplete: false,
    score: 0,
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initGame = async () => {
      try {
        await loadEmbeddings();
        const [start, target] = await findRandomWordPair();
        setGame({
          startWord: start,
          targetWord: target,
          currentChain: [start],
          isComplete: false,
          score: 0,
        });
        setIsLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize game",
          variant: "destructive",
        });
      }
    };

    initGame();
  }, []);

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWord) return;
    
    const lastWord = game.currentChain[game.currentChain.length - 1];
    const similarity = cosineSimilarity(
      (await loadEmbeddings())[lastWord],
      (await loadEmbeddings())[currentWord]
    );
    
    if (similarity < 0.7) {
      toast({
        title: "Invalid word",
        description: "This word is not similar enough to the previous word",
        variant: "destructive",
      });
      return;
    }
    
    const newChain = [...game.currentChain, currentWord];
    const similarityToTarget = cosineSimilarity(
      (await loadEmbeddings())[currentWord],
      (await loadEmbeddings())[game.targetWord]
    );
    
    const newProgress = calculateProgress(similarityToTarget);
    setProgress(newProgress);
    
    if (similarityToTarget >= 0.7) {
      setGame({
        ...game,
        currentChain: newChain,
        isComplete: true,
        score: newChain.length - 1,
      });
      
      saveHighScore({
        startWord: game.startWord,
        targetWord: game.targetWord,
        chain: newChain,
        score: newChain.length - 1,
        timestamp: Date.now(),
      });
      
      toast({
        title: "Congratulations!",
        description: `You completed the chain in ${newChain.length - 1} steps!`,
      });
    } else {
      setGame({
        ...game,
        currentChain: newChain,
        score: newChain.length - 1,
      });
    }
    
    setCurrentWord("");
  };

  const handleNewGame = async () => {
    setIsLoading(true);
    const [start, target] = await findRandomWordPair();
    setGame({
      startWord: start,
      targetWord: target,
      currentChain: [start],
      isComplete: false,
      score: 0,
    });
    setProgress(0);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Word Bridge...</h1>
          <Progress value={undefined} className="w-[60vw]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Word Bridge</h1>
          <p className="text-muted-foreground">
            Connect the words using similar words
          </p>
        </div>

        <div className="flex justify-between items-center text-2xl font-bold">
          <div>{game.startWord}</div>
          <div className="text-muted-foreground">→</div>
          <div>{game.targetWord}</div>
        </div>

        <Progress value={progress} className="w-full" />

        <div className="space-y-2">
          {game.currentChain.map((word, index) => (
            <div
              key={index}
              className="p-2 bg-secondary rounded-md text-center"
            >
              {word}
            </div>
          ))}
        </div>

        {!game.isComplete && (
          <form onSubmit={handleWordSubmit} className="space-y-4">
            <Input
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value.toLowerCase())}
              placeholder="Enter a word..."
              className="text-center"
            />
            <Button type="submit" className="w-full">
              Submit Word
            </Button>
          </form>
        )}

        {game.isComplete && (
          <div className="space-y-4">
            <div className="text-center text-xl">
              Score: {game.score} steps
            </div>
            <Button onClick={handleNewGame} className="w-full">
              New Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;