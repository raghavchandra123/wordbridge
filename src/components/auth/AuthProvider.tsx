import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from '../ui/use-toast';

interface AuthContextType {
  session: Session | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();

  const ensureUserProfile = async (session: Session) => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If profile exists, just update it
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: session.user.user_metadata.name,
            full_name: session.user.user_metadata.full_name,
            avatar_url: session.user.user_metadata.avatar_url,
          })
          .eq('id', session.user.id);

        if (updateError) throw updateError;
        return;
      }

      // If profile doesn't exist, create it along with statistics
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          username: session.user.user_metadata.name,
          full_name: session.user.user_metadata.full_name,
          avatar_url: session.user.user_metadata.avatar_url,
          experience: 0,
          level: 1
        });

      if (insertError) throw insertError;

      // Initialize user statistics
      const { error: statsError } = await supabase
        .from('user_statistics')
        .insert({
          user_id: session.user.id,
          total_games: 0,
          total_score: 0
        });

      if (statsError) throw statsError;
    } catch (error: any) {
      console.error('Error ensuring user profile:', error);
      toast({
        title: "Profile Error",
        description: "There was an error setting up your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        ensureUserProfile(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        ensureUserProfile(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};