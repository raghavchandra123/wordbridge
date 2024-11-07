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
import { useQuery } from "@tanstack/react-query";

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
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('🎮 EndGameDialog render:', {
    isOpen: open,
    userId: session?.user?.id,
    timestamp: new Date().toISOString()
  });
  
  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      console.log('🔍 Profile query function executing:', {
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (!session?.user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url, level, experience')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.error('❌ Profile query error:', {
          error,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      console.log('✅ Profile query success:', {
        hasData: !!data,
        timestamp: new Date().toISOString()
      });

      return data;
    },
    enabled: !!session?.user?.id && open,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000, // Changed from cacheTime to gcTime
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  useEffect(() => {
    console.log('👤 Profile data effect:', {
      hasProfile: !!profile,
      timestamp: new Date().toISOString()
    });

    if (profile) {
      setUserProfile(profile);
      setIsLoading(false);
    }
  }, [profile]);

  if (!open) return null;

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
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 bg-gray-200 rounded-full w-16 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            </div>
          ) : (
            userProfile && <EndGameProfile userProfile={userProfile} />
          )}
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