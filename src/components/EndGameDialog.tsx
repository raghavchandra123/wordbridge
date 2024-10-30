import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameState } from "@/lib/types";
import { generateShareText, generateShareImage } from "@/lib/utils/share";
import { useState, useEffect } from "react";
import WordDisplay from "./WordDisplay";

interface EndGameDialogProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
}

const EndGameDialog = ({ game, open, onClose }: EndGameDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const nextPuzzleTime = new Date();
  nextPuzzleTime.setHours(24, 0, 0, 0);
  
  const timeUntilNext = nextPuzzleTime.getTime() - Date.now();
  const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

  useEffect(() => {
    if (open) {
      generateShareImage(game).then(blob => {
        setImageUrl(URL.createObjectURL(blob));
      });
    }
  }, [open, game]);

  const handleShare = async () => {
    const text = generateShareText(game);
    if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
      try {
        const blob = await generateShareImage(game);
        await navigator.share({
          text,
          files: [new File([blob], 'wordbridge.png', { type: 'image/png' })]
        });
      } catch (err) {
        console.error('Share failed:', err);
        handleDownload();
      }
    } else {
      handleDownload();
      await navigator.clipboard.writeText(text);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'wordbridge.png';
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-lg text-center">
            You connected {game.startWord} to {game.targetWord} in {game.score} steps!
          </p>
          
          {imageUrl && (
            <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Game result" 
                className="w-full h-full object-contain"
                onClick={handleDownload}
              />
            </div>
          )}

          <Button 
            onClick={handleShare}
            className="w-full bg-[#FF8B8B] hover:bg-[#FF8B8B]/90 text-white"
          >
            Share
          </Button>
          
          <p className="text-sm text-center text-muted-foreground">
            Next puzzle in {hoursUntilNext}h {minutesUntilNext}m
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndGameDialog;