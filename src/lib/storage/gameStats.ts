const DAILY_SCORE_KEY = 'word-bridge-daily-score';
const TOTAL_GAMES_KEY = 'word-bridge-total-games';
const TOTAL_SCORE_KEY = 'word-bridge-total-score';

export const saveGameStats = (score: number, isDaily: boolean) => {
  const totalGames = Number(localStorage.getItem(TOTAL_GAMES_KEY) || '0') + 1;
  const totalScore = Number(localStorage.getItem(TOTAL_SCORE_KEY) || '0') + score;
  
  localStorage.setItem(TOTAL_GAMES_KEY, totalGames.toString());
  localStorage.setItem(TOTAL_SCORE_KEY, totalScore.toString());
  
  if (isDaily) {
    localStorage.setItem(DAILY_SCORE_KEY, JSON.stringify({
      score,
      date: new Date().toISOString().split('T')[0]
    }));
  }
};

export const getGameStats = () => {
  const totalGames = Number(localStorage.getItem(TOTAL_GAMES_KEY) || '0');
  const totalScore = Number(localStorage.getItem(TOTAL_SCORE_KEY) || '0');
  const dailyScore = localStorage.getItem(DAILY_SCORE_KEY);
  
  return {
    totalGames,
    totalScore,
    averageScore: totalGames > 0 ? Math.round(totalScore / totalGames) : 0,
    dailyScore: dailyScore ? JSON.parse(dailyScore) : null
  };
};

export const clearGameStats = () => {
  localStorage.removeItem(TOTAL_GAMES_KEY);
  localStorage.removeItem(TOTAL_SCORE_KEY);
  localStorage.removeItem(DAILY_SCORE_KEY);
};