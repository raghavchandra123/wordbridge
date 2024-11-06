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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EndGameProfile } from "./game/EndGameProfile";
import { EndGameActions } from "./game/EndGameActions";
import { EndGameTimer } from "./game/EndGameTimer";

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    if (session?.user?.id) {
      supabase
        .from('profiles')
        .select('username, full_name, avatar_url, level, experience')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setUserProfile(data);
          }
        });
    }
  }, [session?.user?.id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations!
          </DialogTitle>
          <DialogDescription className="text-center">
            You connected {game.startWord} to {game.targetWord} in {game.score} steps!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {userProfile && <EndGameProfile userProfile={userProfile} />}
          <EndGameActions game={game} setGame={setGame} onClose={onClose} />
          <div className="border-t pt-4">
            <TopScores />
          </div>
          <EndGameTimer />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndGameDialog;