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
import { supabase } from "@/integrations/supabase/client";
import { EndGameProfile } from "./game/EndGameProfile";
import { EndGameActions } from "./game/EndGameActions";
import { EndGameTimer } from "./game/EndGameTimer";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface UserProfile {
  username: string;
  full_name: string;
  avatar_url: string;
  level: number;
  experience: number;
}

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  setGame: (game: GameState) => void;
}

const EndGameDialog = ({ game, open, onClose, setGame }: EndGameDialogProps) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [dataReady, setDataReady] = useState(false);

  // Reset dataReady when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Small delay to ensure DB updates are complete
      setTimeout(() => setDataReady(true), 500);
    } else {
      setDataReady(false);
    }
  }, [open]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', session?.user?.id, dataReady],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url, level, experience')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id && open && dataReady,
    staleTime: 0
  });

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
            {isLoading || !dataReady ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-200 rounded-full w-16 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              </div>
            ) : (
              profile && <EndGameProfile userProfile={profile} />
            )}
            <EndGameActions game={game} setGame={setGame} onClose={onClose} />
          </div>
          
          {dataReady && (
            <div className="border-t pt-4 overflow-auto min-h-0 flex-1">
              <TopScores showViewAll={false} />
            </div>
          )}
          
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