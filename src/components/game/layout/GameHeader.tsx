import { Trophy, BookOpen, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { CardTitle } from "@/components/ui/card";
import { THEME_COLORS } from "@/lib/constants";

export const GameHeader = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <div className="space-y-2 pb-2">
      <div className="flex justify-between items-center">
        <div className="w-10" /> {/* Spacer for alignment */}
        <CardTitle className="text-4xl text-center">Word Bridge</CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/leaderboard')}
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

      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Connect the words using similar words
        </p>
        <button
          onClick={() => {}}
          className="inline-flex items-center px-3 py-1 text-sm rounded-md"
          style={{ 
            backgroundColor: `${THEME_COLORS.GRADIENT.MID2}33`,
            color: THEME_COLORS.TEXT.PRIMARY
          }}
        >
          <BookOpen className="w-3 h-3 mr-1" />
          Tutorial
        </button>
      </div>
    </div>
  );
};