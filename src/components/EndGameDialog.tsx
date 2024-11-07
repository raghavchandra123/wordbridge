import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GameState } from "@/lib/types";
import { TopScores } from "./leaderboard/TopScores";
import { useAuth } from "./auth/AuthProvider";
import { EndGameProfile } from "./game/EndGameProfile";
import { EndGameActions } from "./game/EndGameActions";
import { EndGameTimer } from "./game/EndGameTimer";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  setGame: (game: GameState) => void;
}

const EndGameDialog = ({ game, open, onClose, setGame }: EndGameDialogProps) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (open && game.isComplete) {
      // Invalidate queries when dialog opens with completed game
      queryClient.invalidateQueries({ queryKey: ['topScores'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  }, [open, game.isComplete, queryClient]);

  const handleViewLeaderboard = () => {
    onClose();
    navigate('/leaderboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-2 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations!
          </DialogTitle>
          <DialogDescription className="text-center">
            You connected {game.startWord} to {game.targetWord} in {game.score} steps!
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex-shrink-0">
            {session?.user?.id && (
              <EndGameProfile 
                userId={session.user.id} 
                gameComplete={game.isComplete} 
              />
            )}
            <EndGameActions game={game} setGame={setGame} onClose={onClose} />
          </div>
          
          <div className="border-t pt-4 overflow-auto min-h-0 flex-1">
            <TopScores />
          </div>
          
          <div className="flex-shrink-0 pt-2 border-t space-y-2">
            <Button 
              onClick={handleViewLeaderboard}
              variant="outline" 
              className="w-full"
            >
              View Full Leaderboard
            </Button>
            <EndGameTimer />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndGameDialog;