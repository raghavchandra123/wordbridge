import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { TopScores } from './TopScores';
import { Progress } from '../ui/progress';

interface LeaderboardEntry {
  username: string;
  full_name: string;
  avatar_url: string;
  score: number;
  level: number;
  experience: number;
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
          full_name,
          avatar_url,
          level,
          experience,
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
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          level: profile.level,
          experience: profile.experience,
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

  const getProgressToNextLevel = (experience: number) => {
    const currentLevelExp = (Math.floor(experience / 100)) * 100;
    return ((experience - currentLevelExp) / 100) * 100;
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
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-3 py-2 font-semibold text-gray-600">
                  <div>Rank</div>
                  <div>Player</div>
                  <div className="text-right">Score</div>
                </div>
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.username}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-3 rounded-lg bg-gray-50"
                  >
                    <div className="relative">
                      <Avatar className={`h-12 w-12 ring-2 ${getLevelColor(entry.level)}`}>
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback>{entry.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 rounded-full">
                        {entry.level}
                      </div>
                      <div className="absolute -bottom-4 left-0 w-full">
                        <Progress value={getProgressToNextLevel(entry.experience)} className="h-1" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="font-medium">{entry.full_name || entry.username}</div>
                      <div className="text-sm text-gray-500">
                        Avg Score: {entry.average_score === Infinity ? '-' : entry.average_score}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {entry.has_played_today ? `Score: ${entry.score}` : 'Not played today'}
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