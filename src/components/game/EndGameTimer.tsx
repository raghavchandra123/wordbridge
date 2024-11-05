import { addDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const EndGameTimer = () => {
  // Calculate next puzzle time in GMT
  const now = new Date();
  const gmtNow = toZonedTime(now, 'GMT');
  const nextPuzzleTime = addDays(startOfDay(gmtNow), 1);
  
  const timeUntilNext = nextPuzzleTime.getTime() - gmtNow.getTime();
  const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <p className="text-sm text-center text-muted-foreground">
      Next puzzle in {hoursUntilNext}h {minutesUntilNext}m
    </p>
  );
};