import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '../ui/card';
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
  average_score: number;
}

export const TopScores = ({ showViewAll = true }: { showViewAll?: boolean }) => {
  const [topScores, setTopScores] = useState<TopScore[]>([]);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopScores = async () => {
      const today = toZonedTime(new Date(), 'GMT').toISOString().split('T')[0];
      
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
        .eq('daily_scores.date', today)
        .order('daily_scores.score', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error fetching top scores:', error);
        return;
      }

      const processedData = data.map((profile: any) => {
        const scores = profile.daily_scores || [];
        const totalScore = scores.reduce((acc: number, curr: any) => acc + curr.score, 0);
        
        return {
          username: profile.username,
          full_name: profile.full_name || profile.username,
          avatar_url: profile.avatar_url,
          level: profile.level,
          experience: profile.experience,
          score: scores[0]?.score || Infinity,
          average_score: scores.length ? Math.round(totalScore / scores.length) : Infinity,
        };
      });

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
        {topScores.map((entry, index) => (
          <div
            key={entry.username}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-3 rounded-lg bg-gray-50"
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
            <div className="flex flex-col">
              <div className="font-medium">{entry.full_name}</div>
              <div className="text-sm text-gray-500">
                Avg Score: {entry.average_score === Infinity ? '-' : entry.average_score}
              </div>
            </div>
            <div className="text-right font-medium">
              Score: {entry.score === Infinity ? '-' : entry.score}
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