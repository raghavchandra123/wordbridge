import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../auth/AuthProvider';
import { format } from 'date-fns';

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

      // Sort by today's score (players who haven't played today go to the bottom)
      processedData.sort((a, b) => {
        if (!a.has_played_today && !b.has_played_today) return 0;
        if (!a.has_played_today) return 1;
        if (!b.has_played_today) return -1;
        return a.score - b.score;
      });

      setLeaderboard(processedData);
    };

    fetchLeaderboard();
  }, []);

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-[#97BED9] p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
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
        </CardContent>
      </Card>
    </div>
  );
}