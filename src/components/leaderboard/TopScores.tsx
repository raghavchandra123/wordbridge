import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Progress } from '../ui/progress';
import { toZonedTime } from 'date-fns-tz';
import { useQuery } from '@tanstack/react-query';

interface TopScore {
  username: string;
  full_name: string;
  avatar_url: string;
  score: number | null;
  level: number;
  experience: number;
  average_score: number | null;
}

async function fetchLeaderboardData() {
  const today = toZonedTime(new Date(), 'GMT').toISOString().split('T')[0];
  
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

  if (profilesError) throw profilesError;

  const { data: todayScores, error: todayError } = await supabase
    .from('daily_scores')
    .select(`
      score,
      user_id
    `)
    .eq('date', today);

  if (todayError) throw todayError;

  const { data: statsData, error: statsError } = await supabase
    .from('user_statistics')
    .select('user_id, total_games, total_score');

  if (statsError) throw statsError;

  const processedData: TopScore[] = profiles.map((profile: any) => {
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

  return processedData.slice(0, 5);
}

export const TopScores = ({ showViewAll = true }: { showViewAll?: boolean }) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: topScores, isLoading } = useQuery({
    queryKey: ['topScores'],
    queryFn: async () => {
      const data = await fetchLeaderboardData();
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getProgressToNextLevel = (experience: number) => {
    const currentLevelExp = (Math.floor(experience / 100)) * 100;
    return ((experience - currentLevelExp) / 100) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-center mb-4">Top Players Today</div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse grid grid-cols-[minmax(0,2fr)_minmax(80px,1fr)_minmax(80px,1fr)] items-center gap-2 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-gray-200 rounded-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-center">Top Players Today</div>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(80px,1fr)_minmax(80px,1fr)] gap-2 px-3 py-2 font-semibold text-gray-600 text-sm">
        <div>Player</div>
        <div className="text-right">Today</div>
        <div className="text-right">Average</div>
      </div>
      <div className="space-y-3 pr-4">
        {topScores?.map((entry) => (
          <div
            key={entry.username}
            className="grid grid-cols-[minmax(0,2fr)_minmax(80px,1fr)_minmax(80px,1fr)] items-center gap-2 p-3 rounded-lg bg-gray-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar className={`h-8 w-8 ring-2 ${getLevelColor(entry.level)}`}>
                  <AvatarImage src={entry.avatar_url} />
                  <AvatarFallback>{entry.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 rounded-full">
                  {entry.level}
                </div>
              </div>
              <div className="font-medium truncate text-sm">{entry.full_name}</div>
            </div>
            <div className="text-right font-medium text-sm">
              {entry.score !== null ? entry.score : '-'}
            </div>
            <div className="text-right text-gray-600 text-sm">
              {entry.average_score !== null ? entry.average_score.toFixed(2) : '-'}
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
