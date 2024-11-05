import {
  Dialog,
  DialogContent,
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
import { utcToZonedTime } from 'date-fns-tz';

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  setGame: (game: GameState) => void;
}

interface UserProfile {
  username: string;
  full_name: string;
  avatar_url: string;
  level: number;
  experience: number;
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

  // Calculate next puzzle time in GMT
  const now = new Date();
  const gmtNow = utcToZonedTime(now, 'GMT');
  const nextPuzzleTime = addDays(startOfDay(gmtNow), 1);
  
  const timeUntilNext = nextPuzzleTime.getTime() - gmtNow.getTime();
  const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

  const getProgressToNextLevel = (experience: number) => {
    const currentLevelExp = (Math.floor(experience / 100)) * 100;
    return ((experience - currentLevelExp) / 100) * 100;
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleShare = async () => {
    const shareText = generateShareText(game);
    
    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          description: "Copied to clipboard!",
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast({
        description: "Sharing failed. Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setGame({
      ...game,
      currentChain: [game.startWord],
      wordProgresses: [],
      isComplete: false,
      score: 0
    });
    onClose();
  };

  const handleNewWords = async () => {
    try {
      const [startWord, targetWord] = await findRandomWordPair({});
      setGame({
        startWord,
        targetWord,
        currentChain: [startWord],
        wordProgresses: [],
        isComplete: false,
        score: 0
      });
      onClose();
    } catch (err) {
      console.error('Failed to generate new words:', err);
      toast({
        description: "Failed to generate new words. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-lg text-center">
            You connected {game.startWord} to {game.targetWord} in {game.score} steps!
          </p>

          {userProfile && (
            <div className="flex flex-col items-center space-y-2 py-4">
              <div className="relative">
                <Avatar className={`h-16 w-16 ring-2 ${getLevelColor(userProfile.level)}`}>
                  <AvatarImage src={userProfile.avatar_url} />
                  <AvatarFallback>{userProfile.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 rounded-full">
                  Level {userProfile.level}
                </div>
              </div>
              <div className="w-full mt-4">
                <Progress value={getProgressToNextLevel(userProfile.experience)} className="h-2" />
                <p className="text-sm text-center mt-1 text-gray-600">
                  {userProfile.experience % 100}/100 XP to next level
                </p>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleShare}
            className="w-full bg-[#97BED9] hover:bg-[#97BED9]/90 text-white"
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button 
            onClick={handleRetry}
            className="w-full bg-[#FF8B8B] hover:bg-[#FF8B8B]/90 text-white"
          >
            Retry
          </Button>

          <Button 
            onClick={handleNewWords}
            variant="outline"
            className="w-full"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            New Game
          </Button>

          <div className="border-t pt-4">
            <TopScores />
          </div>
          
          <p className="text-sm text-center text-muted-foreground">
            Next puzzle in {hoursUntilNext}h {minutesUntilNext}m
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndGameDialog;
