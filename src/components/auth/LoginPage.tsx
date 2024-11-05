import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

export default function LoginPage() {
  const navigate = useNavigate();
  const redirectTo = `${window.location.origin}/`;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#97BED9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="absolute left-4 top-4"
          size="icon"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Word Bridge</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                  },
                },
              },
            }}
            providers={['google']}
            socialLayout="horizontal"
            theme="light"
            redirectTo={redirectTo}
          />
        </CardContent>
      </Card>
    </div>
  );
}