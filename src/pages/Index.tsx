import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { isValidWord } from "@/lib/embeddings";
import { saveHighScore } from "@/lib/storage";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { validateWordForChain } from "@/lib/services/gameService";
import EndGameDialog from "@/components/EndGameDialog";
import GameBoard from "@/components/GameBoard";
import { saveGameProgress } from "@/lib/storage/gameStorage";
import { TARGET_WORD_MIN_SIMILARITY } from "@/lib/constants";
import { calculateProgress } from "@/lib/embeddings/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDynamicDifficulty } from "@/hooks/useDynamicDifficulty";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { GameHeader } from "@/components/game/layout/GameHeader";

const Index = () => {
  const { startWord, targetWord } = useParams();
  const { toast } = useToast();
  const { game, setGame, isLoading } = useGameInitialization(startWord, targetWord);
  const [currentWord, setCurrentWord] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);
  const { onWordRejected } = useDynamicDifficulty();
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || isChecking) return;

    setIsChecking(true);

    try {
      if (!isValidWord(currentWord)) {
        onWordRejected();
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
        onWordRejected();
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
        saveHighScore({
          score: newGame.currentChain.length - 1,
          date: new Date().toISOString(),
          words: {
            start: newGame.startWord,
            target: newGame.targetWord
          }
        });
        setShowEndGame(true);
      }
      
      setCurrentWord("");
      setEditingIndex(null);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#97BED9]">
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
    <div className="min-h-screen bg-[#97BED9]">
      <Card className="max-w-2xl mx-auto rounded-none h-screen bg-[#F5F8FA]">
        <CardContent>
          <GameHeader />
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
        </CardContent>
      </Card>

      <EndGameDialog
        game={game}
        open={showEndGame}
        onClose={() => setShowEndGame(false)}
        setGame={setGame}
      />
    </div>
  );
};

export default Index;
