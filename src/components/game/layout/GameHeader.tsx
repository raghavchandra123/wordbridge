import { Trophy, BookOpen, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { CardTitle } from "@/components/ui/card";

export const GameHeader = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <div className="space-y-0 pb-2">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/leaderboard')}
          className="flex items-center justify-center w-10 h-10 rounded-md bg-[#FFD700] hover:bg-[#FFD700]/90 text-white transition-colors"
          title="Leaderboard"
        >
          <Trophy className="w-5 h-5" />
        </button>
        
        <CardTitle className="text-4xl text-center flex-1">Word Bridge</CardTitle>
        
        {session ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title="Sign In"
          >
            <LogIn className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <button
        onClick={() => {}}
        className="inline-flex items-center px-3 py-1 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
      >
        <BookOpen className="w-3 h-3 mr-1" />
        Tutorial
      </button>
    </div>
  );
};