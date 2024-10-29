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
  calculateProgress,
  isValidWord,
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
        console.error('Game initialization failed:', error);
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
    
    console.log('Word submitted:', currentWord);
    
    if (!isValidWord(currentWord)) {
      toast({
        title: "Invalid word",
        description: "This word is not in our dictionary",
        variant: "destructive",
      });
      return;
    }

    const lastWord = game.currentChain[game.currentChain.length - 1];
    console.log('Comparing with last word:', lastWord);
    
    const similarity = cosineSimilarity(lastWord, currentWord);
    console.log('Similarity with previous word:', similarity);
    
    if (similarity < 0.7) {
      toast({
        title: "Word not similar enough",
        description: "Try a word that's more closely related to the previous word",
        variant: "destructive",
      });
      return;
    }
    
    const newChain = [...game.currentChain, currentWord];
    const similarityToTarget = cosineSimilarity(currentWord, game.targetWord);
    console.log('Similarity to target word:', similarityToTarget);
    
    const newProgress = calculateProgress(similarityToTarget);
    setProgress(newProgress);
    
    if (similarityToTarget >= 0.7) {
      console.log('Game completed!');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-[90vw] max-w-md border-2 border-pink-100 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
              Loading Word Bridge...
            </CardTitle>
            <CardDescription className="text-center">
              Preparing your word adventure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={undefined} className="w-full bg-pink-100 dark:bg-gray-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-2xl mx-auto border-2 border-pink-100 dark:border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl text-center mb-2 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
            Word Bridge
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Connect the words using similar words
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex justify-between items-center text-2xl font-bold">
            <div className="p-4 bg-pink-100/50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
              {game.startWord}
            </div>
            <div className="text-blue-400 dark:text-blue-300">→</div>
            <div className="p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              {game.targetWord}
            </div>
          </div>

          <Progress 
            value={progress} 
            className="w-full h-2 bg-pink-100 dark:bg-gray-700" 
          />

          <div className="space-y-2">
            {game.currentChain.map((word, index) => (
              <div
                key={index}
                className="p-3 bg-gradient-to-r from-pink-100/50 to-blue-100/50 dark:from-pink-900/20 dark:to-blue-900/20 rounded-md text-center font-medium border border-pink-200/50 dark:border-gray-700"
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
                className="text-center text-lg border-2 border-pink-100 dark:border-gray-700 focus:border-pink-200 dark:focus:border-pink-600"
              />
              <Button 
                type="submit" 
                className="w-full text-lg bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white border-none"
              >
                Submit Word
              </Button>
            </form>
          )}

          {game.isComplete && (
            <div className="space-y-4">
              <div className="text-center text-2xl font-semibold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                Score: {game.score} steps
              </div>
              <Button 
                onClick={handleNewGame} 
                className="w-full text-lg bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white border-none"
              >
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