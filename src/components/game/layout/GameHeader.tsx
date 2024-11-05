import { Trophy, BookOpen, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { CardTitle } from "@/components/ui/card";
import { THEME_COLORS } from "@/lib/constants";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { TopScores } from "@/components/leaderboard/TopScores";

export const GameHeader = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="space-y-2 pb-2">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowTutorial(true)}
          className="flex items-center justify-center gap-2 px-3 h-8 rounded-md"
          style={{ 
            backgroundColor: `${THEME_COLORS.GRADIENT.START}`,
            color: THEME_COLORS.TEXT.PRIMARY
          }}
          title="Tutorial"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-sm">Tutorial</span>
        </button>

        <CardTitle className="text-4xl text-center">Word Bridge</CardTitle>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center justify-center w-8 h-8 rounded-md"
            style={{ 
              backgroundColor: `${THEME_COLORS.GRADIENT.MID1}`,
              color: THEME_COLORS.TEXT.PRIMARY
            }}
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
          </button>
          
          {session ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center justify-center w-8 h-8 rounded-md"
              style={{ 
                backgroundColor: `${THEME_COLORS.GRADIENT.END}`,
                color: THEME_COLORS.TEXT.PRIMARY
              }}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center w-8 h-8 rounded-md"
              style={{ 
                backgroundColor: `${THEME_COLORS.GRADIENT.START}`,
                color: THEME_COLORS.TEXT.PRIMARY
              }}
              title="Sign In"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-2xl">
          <img 
            src="/images/tutorial.jpg" 
            alt="Tutorial" 
            className="w-full rounded-lg shadow-md"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-md">
          <TopScores />
        </DialogContent>
      </Dialog>
    </div>
  );
};