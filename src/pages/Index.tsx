import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isValidWord } from "@/lib/embeddings";
import { calculateProgress } from "@/lib/embeddings/utils";
import { saveHighScore } from "@/lib/storage";
import WordChain from "@/components/WordChain";
import { SIMILARITY_THRESHOLDS } from "@/lib/constants";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { validateWordForChain, initializeGame } from "@/lib/services/gameService";

const Index = () => {
  const { toast } = useToast();
  const { game, setGame, isLoading } = useGameInitialization();
  const [currentWord, setCurrentWord] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Handle word submission
  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || isChecking) return;

    setIsChecking(true);

    try {
      // Validate word exists
      if (!isValidWord(currentWord)) {
        toast({
          title: "Invalid word",
          description: "This word is not in our dictionary",
          variant: "destructive",
        });
        return;
      }

      // Get previous word based on editing context
      const previousWord = game.currentChain[editingIndex !== null ? editingIndex - 1 : game.currentChain.length - 1];
      
      // Validate word for the chain
      const validation = await validateWordForChain(currentWord, previousWord, game.targetWord);
      
      if (!validation.isValid) {
        toast({
          title: "Word not similar enough",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }

      // Update game state
      const newChain = editingIndex !== null
        ? [...game.currentChain.slice(0, editingIndex), currentWord]
        : [...game.currentChain, currentWord];
      
      const newProgress = calculateProgress(validation.similarityToTarget);
      setProgress(newProgress);
      
      if (validation.similarityToTarget >= SIMILARITY_THRESHOLDS.TARGET) {
        handleGameComplete(newChain);
      } else {
        setGame({
          ...game,
          currentChain: newChain,
          score: newChain.length - 1,
        });
      }
      
      setCurrentWord("");
      setEditingIndex(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle game completion
  const handleGameComplete = (chain: string[]) => {
    setGame({
      ...game,
      currentChain: chain,
      isComplete: true,
      score: chain.length - 1,
    });
    
    saveHighScore({
      startWord: game.startWord,
      targetWord: game.targetWord,
      chain,
      score: chain.length - 1,
      timestamp: Date.now(),
    });
    
    toast({
      title: "Congratulations!",
      description: `You completed the chain in ${chain.length - 1} steps!`,
    });
  };

  // Handle word selection for editing
  const handleWordClick = (index: number | null) => {
    if (index === 0 || game.isComplete) return;
    setEditingIndex(index);
    setCurrentWord(index !== null ? game.currentChain[index] : "");
  };

  // Start a new game
  const handleNewGame = async () => {
    const newGame = await initializeGame();
    setGame(newGame);
    setProgress(0);
    setEditingIndex(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[90vw] max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Loading Word Bridge...
            </CardTitle>
            <CardDescription className="text-center">
              Preparing your word adventure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={undefined} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-4xl text-center mb-2">
            Word Bridge
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Connect the words using similar words
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Word display */}
          <div className="flex justify-between items-center text-2xl font-bold">
            <div className="p-4 bg-pink-100/70 rounded-lg border border-pink-200/70">
              {game.startWord}
            </div>
            <div className="text-blue-400">→</div>
            <div className="p-4 bg-blue-100/70 rounded-lg border border-blue-200/70">
              {game.targetWord}
            </div>
          </div>

          <Progress value={progress} />

          <WordChain
            words={game.currentChain}
            targetWord={game.targetWord}
            onWordClick={handleWordClick}
            selectedWordIndex={editingIndex}
            isGameComplete={game.isComplete}
          />

          {/* Word input form */}
          {!game.isComplete && (
            <form onSubmit={handleWordSubmit} className="space-y-4">
              <Input
                value={currentWord}
                onChange={(e) => setCurrentWord(e.target.value.toLowerCase())}
                placeholder={editingIndex !== null ? `Change word #${editingIndex + 1}` : "Enter a word..."}
                className="text-center text-lg"
                disabled={isChecking}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 text-lg" disabled={isChecking}>
                  {isChecking ? "Checking..." : (editingIndex !== null ? "Update Word" : "Submit Word")}
                </Button>
                {editingIndex !== null && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingIndex(null);
                      setCurrentWord("");
                    }}
                    className="text-lg"
                    disabled={isChecking}
                  >
                    Add New Word
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Game complete UI */}
          {game.isComplete && (
            <div className="space-y-4">
              <div className="text-center text-2xl font-semibold">
                Score: {game.score} steps
              </div>
              <Button onClick={handleNewGame} className="w-full text-lg">
                New Game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;