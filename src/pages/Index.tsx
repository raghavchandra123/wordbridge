import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { isValidWord } from "@/lib/embeddings";
import { saveHighScore } from "@/lib/storage";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { validateWordForChain, initializeGame } from "@/lib/services/gameService";
import EndGameDialog from "@/components/EndGameDialog";
import GameBoard from "@/components/GameBoard";
import { saveGameProgress } from "@/lib/storage/gameStorage";
import { SIMILARITY_THRESHOLD } from "@/lib/constants";
import { calculateProgress } from "@/lib/embeddings/utils";

const Index = () => {
  const { toast } = useToast();
  const { game, setGame, isLoading } = useGameInitialization();
  const [currentWord, setCurrentWord] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || isChecking) return;

    setIsChecking(true);

    try {
      if (!isValidWord(currentWord)) {
        toast({
          title: "Invalid word",
          description: "This word is not in our dictionary",
          variant: "destructive",
        });
        return;
      }

      const previousWord = game.currentChain[editingIndex !== null ? editingIndex - 1 : game.currentChain.length - 1];
      const validation = await validateWordForChain(currentWord, previousWord, game.targetWord);
      
      if (!validation.isValid) {
        toast({
          title: "Word not similar enough",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }

      const newProgress = calculateProgress(validation.similarityToTarget);
      
      let newWordProgresses;
      if (editingIndex !== null) {
        // When editing, only update the progress for the edited word
        newWordProgresses = [...game.wordProgresses];
        if (editingIndex > 0) {
          newWordProgresses[editingIndex - 1] = newProgress;
        }
      } else {
        // When adding a new word, append its progress
        newWordProgresses = [...game.wordProgresses, newProgress];
      }

      const newChain = editingIndex !== null
        ? [...game.currentChain.slice(0, editingIndex), currentWord]
        : [...game.currentChain, currentWord];
      
      setProgress(newProgress);
      
      const isComplete = validation.similarityToTarget >= SIMILARITY_THRESHOLD;
      
      const newGame = {
        ...game,
        currentChain: newChain,
        wordProgresses: newWordProgresses,
        score: newChain.length - 1,
        isComplete
      };

      setGame(newGame);
      saveGameProgress(newGame);
      
      if (isComplete) {
        handleGameComplete(newGame);
      }
      
      setCurrentWord("");
      setEditingIndex(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGameComplete = (completedGame: typeof game) => {
    saveHighScore({
      startWord: completedGame.startWord,
      targetWord: completedGame.targetWord,
      chain: completedGame.currentChain,
      score: completedGame.currentChain.length - 1,
      timestamp: Date.now(),
    });
    
    setShowEndGame(true);
  };

  const handleNewGame = async () => {
    const newGame = await initializeGame();
    setGame(newGame);
    setProgress(0);
    setEditingIndex(null);
    setShowEndGame(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[90vw] max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Loading Word Bridge...</CardTitle>
            <CardDescription className="text-center">Preparing your word adventure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-[#FF8B8B]/30 rounded-full animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-4xl text-center mb-2">Word Bridge</CardTitle>
          <CardDescription className="text-center text-lg">
            Connect the words using similar words
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GameBoard
            game={game}
            currentWord={currentWord}
            editingIndex={editingIndex}
            isChecking={isChecking}
            onWordSubmit={handleWordSubmit}
            onWordChange={setCurrentWord}
            onWordClick={setEditingIndex}
            progress={progress}
          />
          
          {game.isComplete && (
            <div className="mt-8 space-y-4">
              <div className="text-center text-2xl font-semibold">
                Score: {game.score} steps
              </div>
              <Button onClick={handleNewGame} className="w-full text-lg">
                New Game
              </Button>
              <Button 
                onClick={() => setShowEndGame(true)} 
                variant="outline"
                className="w-full text-lg"
              >
                Share Result
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <EndGameDialog
        game={game}
        open={showEndGame}
        onClose={() => setShowEndGame(false)}
      />
    </div>
  );
};

export default Index;