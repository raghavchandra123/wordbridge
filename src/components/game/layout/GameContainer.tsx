import { cn } from "@/lib/utils";

interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
  mainHeight: number;
}

export const GameContainer = ({ children, className, mainHeight }: GameContainerProps) => (
  <div 
    className={cn("flex flex-col space-y-1 mx-2 pb-safe", className)}
    style={{ 
      height: mainHeight + 'px',
      maxHeight: '100%',
      paddingBottom: `calc(env(safe-area-inset-bottom) + 0.5rem)`
    }}
  >
    {children}
  </div>
);