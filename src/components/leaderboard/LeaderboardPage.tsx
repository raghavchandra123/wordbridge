import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { toZonedTime } from 'date-fns-tz';

interface LeaderboardEntry {
  username: string;
  full_name: string;
  avatar_url: string;
  score: number;
  level: number;
  experience: number;
  average_score: number | null;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const today = toZonedTime(new Date(), 'GMT').toISOString().split('T')[0];
      
      const { data: todayScores, error: todayError } = await supabase
        .from('daily_scores')
        .select(`
          score,
          profiles!inner (
            username,
            full_name,
            avatar_url,
            level,
            experience
          )
        `)
        .eq('date', today)
        .order('score', { ascending: true });

      if (todayError) {
        console.error('Error fetching leaderboard:', todayError);
        return;
      }

      if (!todayScores) {
        setLeaderboard([]);
        return;
      }

      const userIds = todayScores.map((score: any) => score.profiles.id).filter(Boolean);
      
      const { data: statsData, error: statsError } = await supabase
        .from('user_statistics')
        .select('user_id, total_games, total_score')
        .in('user_id', userIds);

      if (statsError) {
        console.error('Error fetching user statistics:', statsError);
        return;
      }

      const processedData = todayScores.map((entry: any) => {
        const userStats = statsData?.find(stat => stat.user_id === entry.profiles.id);
        const averageScore = userStats && userStats.total_games > 0
          ? Number((userStats.total_score / userStats.total_games).toFixed(2))
          : null;

        return {
          username: entry.profiles.username,
          full_name: entry.profiles.full_name || entry.profiles.username,
          avatar_url: entry.profiles.avatar_url,
          level: entry.profiles.level,
          experience: entry.profiles.experience,
          score: entry.score,
          average_score: averageScore
        };
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

  if (!session) {
    return (
      <div className="min-h-screen bg-[#97BED9] p-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-lg">Sign in to view the leaderboard</p>
              <Button
                onClick={() => navigate('/login')}
                className="bg-[#97BED9] hover:bg-[#97BED9]/90 text-white"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#97BED9] p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Button
            onClick={() => navigate('/')}
            className="w-24"
          >
            Back
          </Button>
          <CardTitle className="text-2xl text-center -mt-8">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2 font-semibold text-gray-600">
                <div>Player</div>
                <div className="text-right">Today's Score</div>
                <div className="text-right">Average Score</div>
              </div>
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.username}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className={`h-12 w-12 ring-2 ${getLevelColor(entry.level)}`}>
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback>{entry.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 rounded-full">
                        {entry.level}
                      </div>
                      <div className="absolute -bottom-4 left-0 w-full">
                        <Progress value={getProgressToNextLevel(entry.experience)} className="h-1" />
                      </div>
                    </div>
                    <div className="font-medium ml-2">{entry.full_name}</div>
                  </div>
                  <div className="text-right font-medium">{entry.score}</div>
                  <div className="text-right font-medium">
                    {entry.average_score !== null ? entry.average_score.toFixed(2) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}