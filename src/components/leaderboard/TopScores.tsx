import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Progress } from '../ui/progress';
import { toZonedTime } from 'date-fns-tz';

interface TopScore {
  username: string;
  full_name: string;
  avatar_url: string;
  score: number;
  level: number;
  experience: number;
  average_score: number | null;
}

export const TopScores = ({ showViewAll = true }: { showViewAll?: boolean }) => {
  const [topScores, setTopScores] = useState<TopScore[]>([]);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopScores = async () => {
      const today = toZonedTime(new Date(), 'GMT').toISOString().split('T')[0];
      
      const { data: todayScores, error: todayError } = await supabase
        .from('daily_scores')
        .select(`
          score,
          user_id,
          profiles!inner (
            username,
            full_name,
            avatar_url,
            level,
            experience
          )
        `)
        .eq('date', today)
        .order('score', { ascending: true })
        .limit(3);

      if (todayError) {
        console.error('Error fetching top scores:', todayError);
        return;
      }

      const userIds = todayScores?.map(score => score.user_id) || [];
      const { data: statsData, error: statsError } = await supabase
        .from('user_statistics')
        .select('user_id, total_games, total_score')
        .in('user_id', userIds);

      if (statsError) {
        console.error('Error fetching user statistics:', statsError);
        return;
      }

      const processedData = todayScores?.map((entry: any) => {
        const userStats = statsData?.find(stat => stat.user_id === entry.user_id);
        const averageScore = userStats && userStats.total_games > 0
          ? (userStats.total_score / userStats.total_games).toFixed(2)
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
      }) || [];

      setTopScores(processedData);
    };

    fetchTopScores();
  }, []);

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
    <div className="space-y-4">
      <div className="text-lg font-semibold text-center mb-4">Top Players Today</div>
      <div className="space-y-4">
        {topScores.map((entry) => (
          <div
            key={entry.username}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 p-3 rounded-lg bg-gray-50"
          >
            <div className="relative">
              <Avatar className={`h-12 w-12 ring-2 ${getLevelColor(entry.level)}`}>
                <AvatarImage src={entry.avatar_url} />
                <AvatarFallback>{entry.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 rounded-full">
                {entry.level}
              </div>
              <div className="absolute -bottom-4 left-0 w-full">
                <Progress value={getProgressToNextLevel(entry.experience)} className="h-1" />
              </div>
            </div>
            <div className="font-medium">{entry.full_name}</div>
            <div className="text-right">
              <div className="font-medium">{entry.score}</div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{entry.average_score || '-'}</div>
              <div className="text-sm text-gray-500">Average</div>
            </div>
          </div>
        ))}
      </div>
      {showViewAll && (
        <Button
          onClick={() => session ? navigate('/leaderboard') : navigate('/login')}
          className="w-full mt-4"
        >
          {session ? 'View Full Leaderboard' : 'Sign in to view full leaderboard'}
        </Button>
      )}
    </div>
  );
};
