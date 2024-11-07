import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

interface LeaderboardEntry {
  username: string;
  full_name: string;
  avatar_url: string;
  score: number | null;
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
      const today = new Date().toISOString().split('T')[0];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          username,
          full_name,
          avatar_url,
          level,
          experience,
          id
        `);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      const { data: todayScores, error: todayError } = await supabase
        .from('daily_scores')
        .select(`
          score,
          user_id
        `)
        .eq('date', today);

      if (todayError) {
        console.error('Error fetching today\'s scores:', todayError);
        return;
      }

      const { data: statsData, error: statsError } = await supabase
        .from('user_statistics')
        .select('user_id, total_games, total_score');

      if (statsError) {
        console.error('Error fetching user statistics:', statsError);
        return;
      }

      const processedData: LeaderboardEntry[] = profiles.map((profile: any) => {
        const todayScore = todayScores?.find(score => score.user_id === profile.id);
        const userStats = statsData?.find(stat => stat.user_id === profile.id);
        const averageScore = userStats && userStats.total_games > 0
          ? Number((userStats.total_score / userStats.total_games).toFixed(2))
          : null;

        return {
          username: profile.username,
          full_name: profile.full_name || profile.username,
          avatar_url: profile.avatar_url,
          level: profile.level,
          experience: profile.experience,
          score: todayScore ? todayScore.score : null,
          average_score: averageScore
        };
      });

      processedData.sort((a, b) => {
        if (a.score === null && b.score === null) {
          return (b.average_score || 0) - (a.average_score || 0);
        }
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        if (a.score === b.score) {
          return (b.average_score || 0) - (a.average_score || 0);
        }
        return a.score - b.score;
      });

      setLeaderboard(processedData.slice(0, 10)); // Only take top 10 for full leaderboard
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
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(80px,1fr)_minmax(80px,1fr)] gap-2 px-3 py-2 font-semibold text-gray-600">
                <div>Player</div>
                <div className="text-right">Today</div>
                <div className="text-right">Average</div>
              </div>
              {leaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.username}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(80px,1fr)_minmax(80px,1fr)] items-center gap-2 p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar className={`h-8 w-8 sm:h-12 sm:w-12 ring-2 ${getLevelColor(entry.level)}`}>
                        <AvatarImage src={entry.avatar_url} />
                        <AvatarFallback>{entry.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 rounded-full">
                        {entry.level}
                      </div>
                      <div className="absolute -bottom-4 left-0 w-full">
                        <Progress value={getProgressToNextLevel(entry.experience)} className="h-1" />
                      </div>
                    </div>
                    <div className="font-medium truncate ml-2">{entry.full_name}</div>
                  </div>
                  <div className="text-right font-medium">
                    {entry.score !== null ? entry.score : '-'}
                  </div>
                  <div className="text-right text-gray-600">
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