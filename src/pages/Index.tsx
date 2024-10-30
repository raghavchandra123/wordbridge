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
import { TARGET_WORD_MIN_SIMILARITY } from "@/lib/constants";
import { calculateProgress } from "@/lib/embeddings/utils";
import { Share } from "lucide-react";

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
        newWordProgresses = [...game.wordProgresses];
        if (editingIndex > 0) {
          newWordProgresses[editingIndex - 1] = newProgress;
        }
      } else {
        newWordProgresses = [...game.wordProgresses, newProgress];
      }

      const newChain = editingIndex !== null
        ? [...game.currentChain.slice(0, editingIndex), currentWord]
        : [...game.currentChain, currentWord];
      
      setProgress(newProgress);
      
      const isComplete = validation.similarityToTarget >= TARGET_WORD_MIN_SIMILARITY;
      
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FA]">
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
    <div className="min-h-screen bg-[#F5F8FA]">
      <Card className="max-w-2xl mx-auto rounded-none h-screen bg-white/80">
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-4xl text-center">Word Bridge</CardTitle>
          <CardDescription className="text-center text-lg">
            Connect the words using similar words
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GameBoard
            game={game}
            setGame={setGame}
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
                <Share className="mr-2 h-4 w-4" />
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