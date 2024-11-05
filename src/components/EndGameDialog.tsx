import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameState } from "@/lib/types";
import { generateShareText } from "@/lib/utils/share";
import { toast } from "@/components/ui/use-toast";
import { Share, Shuffle } from "lucide-react";
import { findRandomWordPair } from "@/lib/embeddings/game";
import { useNavigate } from "react-router-dom";
import { TopScores } from "./leaderboard/TopScores";
import { useAuth } from "./auth/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { addDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { EndGameProfile } from "./game/EndGameProfile";
import { EndGameActions } from "./game/EndGameActions";
import { EndGameTimer } from "./game/EndGameTimer";

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  setGame: (game: GameState) => void;
}

const EndGameDialog = ({ game, open, onClose, setGame }: EndGameDialogProps) => {
  const navigate = useNavigate();
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