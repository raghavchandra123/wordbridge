import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface LeaderboardEntry {
  username: string;
  full_name: string;
  avatar_url: string;
  score: number;
  average_score: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayScores, error: todayError } = await supabase
        .from('daily_scores')
        .select(`
          score,
          user_id,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('date', today)
        .order('score', { ascending: true });

      if (todayError) {
        console.error('Error fetching leaderboard:', todayError);
        return;
      }

      if (!todayScores?.length) {
        setLeaderboard([]);
        return;
      }

      const userIds = todayScores.map(score => score.user_id);
      const { data: statsData, error: statsError } = await supabase
        .from('user_statistics')
        .select('user_id, total_games, total_score')
        .in('user_id', userIds);

      if (statsError) {
        console.error('Error fetching user statistics:', statsError);
        return;
      }

      const processedData = todayScores.map((entry: any) => {
        const userStats = statsData?.find(stat => stat.user_id === entry.user_id);
        const averageScore = userStats && userStats.total_games > 0
          ? Number((userStats.total_score / userStats.total_games).toFixed(2))
          : 0;

        return {
          username: entry.profiles.username,
          full_name: entry.profiles.full_name || entry.profiles.username,
          avatar_url: entry.profiles.avatar_url,
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
        <CardHeader className="flex justify-between items-center">
          <Button
            onClick={() => navigate('/')}
            className="text-sm px-3 py-1 rounded-md bg-[#97BED9] hover:bg-[#97BED9]/90 text-white"
          >
            Back to Game
          </Button>
          <CardTitle className="text-2xl text-center">Leaderboard</CardTitle>
          <div className="w-20" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2 font-semibold text-gray-600">
                <div>Name</div>
                <div className="text-right">Today's Score</div>
                <div className="text-right">Average Score</div>
              </div>
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.username}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar_url} />
                      <AvatarFallback>{entry.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{entry.full_name}</div>
                  </div>
                  <div className="text-right font-medium">{entry.score}</div>
                  <div className="text-right font-medium">{entry.average_score.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}