import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { TopScores } from './TopScores';

interface LeaderboardEntry {
  username: string;
  score: number;
  level: number;
  average_score: number;
  has_played_today: boolean;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          username,
          level,
          daily_scores!inner (
            score,
            date
          )
        `)
        .order('username');

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      const processedData = data.map((profile: any) => {
        const scores = profile.daily_scores || [];
        const todayScore = scores.find((s: any) => s.date === today);
        const totalScore = scores.reduce((acc: number, curr: any) => acc + curr.score, 0);
        
        return {
          username: profile.username,
          level: profile.level,
          score: todayScore?.score || Infinity,
          average_score: scores.length ? Math.round(totalScore / scores.length) : Infinity,
          has_played_today: !!todayScore
        };
      });

      processedData.sort((a, b) => {
        if (!a.has_played_today && !b.has_played_today) return 0;
        if (!a.has_played_today) return 1;
        if (!b.has_played_today) return -1;
        return a.score - b.score;
      });

      setLeaderboard(processedData);
    };

    if (session) {
      fetchLeaderboard();
    }
  }, [session]);

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-[#97BED9] p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <Button
            onClick={() => navigate('/')}
            className="text-sm px-3 py-1 rounded-md bg-[#97BED9] hover:bg-[#97BED9]/90 text-white transition-colors"
          >
            Back to Game
          </Button>
          <CardTitle className="text-2xl text-center">Leaderboard</CardTitle>
          <div className="w-20" /> {/* Spacer for alignment */}
        </CardHeader>
        <CardContent>
          {!session ? (
            <div className="space-y-8">
              <TopScores />
              <div className="text-center">
                <p className="mb-4 text-gray-600">Sign in to see the full leaderboard and track your progress!</p>
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-[#97BED9] hover:bg-[#97BED9]/90 text-white"
                >
                  Sign In
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[70vh]">
              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.username}
                    className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50"
                  >
                    <Avatar className={`${getLevelColor(entry.level)} text-white`}>
                      <AvatarFallback>{entry.level}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{entry.username}</div>
                      <div className="text-sm text-gray-500">
                        Avg Score: {entry.average_score === Infinity ? '-' : entry.average_score}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {entry.has_played_today ? `Score: ${entry.score}` : 'Not played today'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {entry.level}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
