import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "react-router-dom";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import EndGameDialog from "@/components/EndGameDialog";
import GameBoard from "@/components/GameBoard";

const Index = () => {
  const { startWord, targetWord } = useParams();
  const { game, setGame, isLoading } = useGameInitialization(startWord, targetWord);
  const { toast } = useToast();
  const [showEndGame, setShowEndGame] = useState(false);

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
            currentWord={""}
            editingIndex={null}
            isChecking={false}
            onWordSubmit={() => {}}
            onWordChange={() => {}}
            onWordClick={() => {}}
            progress={0}
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