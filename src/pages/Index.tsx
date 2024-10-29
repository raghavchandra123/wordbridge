import { useState, useEffect } from "react";
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
import {
  loadEmbeddings,
  findRandomWordPair,
  cosineSimilarity,
} from "@/lib/embeddings";
import { calculateProgress } from "@/lib/embeddings/utils";
import { saveHighScore } from "@/lib/storage";
import { GameState } from "@/lib/types";
import WordChain from "@/components/WordChain";
import { SIMILARITY_THRESHOLDS } from "@/lib/constants";

// Extract game initialization logic
const useGameInitialization = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [game, setGame] = useState<GameState>({
    startWord: "",
    targetWord: "",
    currentChain: [],
    isComplete: false,
    score: 0,
  });

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
        console.error('Game initialization failed:', error);
      }
    };

    initGame();
  }, []);

  return { isLoading, game, setGame };
};

const Index = () => {
  const { toast } = useToast();
  const { isLoading, game, setGame } = useGameInitialization();
  const [currentWord, setCurrentWord] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;

    const previousWord = game.currentChain[editingIndex !== null ? editingIndex - 1 : game.currentChain.length - 1];
    const similarity = await cosineSimilarity(previousWord, currentWord);
    const similarityToTarget = await cosineSimilarity(currentWord, game.targetWord);
    
    // Log similarities regardless of threshold
    console.log(`Word "${currentWord}" similarity to previous word "${previousWord}": ${similarity}`);
    console.log(`Word "${currentWord}" similarity to target word "${game.targetWord}": ${similarityToTarget}`);
    
    if (similarity < SIMILARITY_THRESHOLDS.MIN) {
      toast({
        title: "Word not similar enough",
        description: `Try a word that's more closely related to "${previousWord}"`,
        variant: "destructive",
      });
      return;
    }
    
    let newChain;
    if (editingIndex !== null) {
      newChain = [...game.currentChain.slice(0, editingIndex), currentWord];
    } else {
      newChain = [...game.currentChain, currentWord];
    }
    
    const newProgress = calculateProgress(similarityToTarget);
    setProgress(newProgress);
    
    if (similarityToTarget >= SIMILARITY_THRESHOLDS.TARGET) {
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
    setEditingIndex(null);
  };

  const handleWordClick = (index: number | null) => {
    if (index === 0 || game.isComplete) return;
    setEditingIndex(index);
    setCurrentWord(index !== null ? game.currentChain[index] : "");
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
    setEditingIndex(null);
    setIsLoading(false);
  };

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

          {!game.isComplete && (
            <form onSubmit={handleWordSubmit} className="space-y-4">
              <Input
                value={currentWord}
                onChange={(e) => setCurrentWord(e.target.value.toLowerCase())}
                placeholder={editingIndex !== null ? `Change word #${editingIndex + 1}` : "Enter a word..."}
                className="text-center text-lg"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 text-lg">
                  {editingIndex !== null ? "Update Word" : "Submit Word"}
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
                  >
                    Add New Word
                  </Button>
                )}
              </div>
            </form>
          )}

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