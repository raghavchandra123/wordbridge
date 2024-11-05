import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { GameState } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
  setGame: (game: GameState) => void;
}

export default function EndGameDialog({ game, open, onClose, setGame }: EndGameDialogProps) {
  const { session } = useAuth();
  const [userLevel, setUserLevel] = useState<number>(1);
  
  useEffect(() => {
    const fetchUserLevel = async () => {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.error('Error fetching user level:', error);
        return;
      }
      
      if (data) {
        setUserLevel(data.level);
      }
    };
    
    if (open) {
      fetchUserLevel();
    }
  }, [session?.user?.id, open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Level {userLevel} - Game Complete!
          </DialogTitle>
          <div className="mt-2 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Your final score: {game.score}</p>
            <p className="text-sm text-muted-foreground">Words used: {game.currentChain.join(' → ')}</p>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}