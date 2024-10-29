import { HighScore } from './types';

const HIGH_SCORES_KEY = 'word-bridge-high-scores';

export const saveHighScore = (score: HighScore) => {
  const scores = getHighScores();
  scores.push(score);
  scores.sort((a, b) => a.score - b.score);
  const topScores = scores.slice(0, 10);
  localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores));
};

export const getHighScores = (): HighScore[] => {
  const scores = localStorage.getItem(HIGH_SCORES_KEY);
  return scores ? JSON.parse(scores) : [];
};