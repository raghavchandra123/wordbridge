import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";

interface UserProfile {
  username: string;
  full_name: string;
  avatar_url: string;
  level: number;
  experience: number;
}

interface EndGameProfileProps {
  userProfile: UserProfile;
}

export const EndGameProfile = ({ userProfile }: EndGameProfileProps) => {
  const getProgressToNextLevel = (experience: number) => {
    const currentLevelExp = (Math.floor(experience / 100)) * 100;
    return ((experience - currentLevelExp) / 100) * 100;
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col items-center space-y-2 py-4">
      <div className="relative">
        <Avatar className={`h-16 w-16 ring-2 ${getLevelColor(userProfile.level)}`}>
          <AvatarImage src={userProfile.avatar_url} />
          <AvatarFallback>{userProfile.username?.[0]}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 rounded-full">
          Level {userProfile.level}
        </div>
      </div>
      <div className="w-full mt-4">
        <Progress value={getProgressToNextLevel(userProfile.experience)} className="h-2" />
        <p className="text-sm text-center mt-1 text-gray-600">
          {userProfile.experience % 100}/100 XP to next level
        </p>
      </div>
    </div>
  );
};