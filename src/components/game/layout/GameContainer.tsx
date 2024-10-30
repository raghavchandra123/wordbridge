import { cn } from "@/lib/utils";
import React from "react";

interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
  mainHeight: number;
}

export const GameContainer = React.forwardRef<HTMLDivElement, GameContainerProps>(
  ({ children, className, mainHeight }, ref) => (
    <div 
      ref={ref}
      className={cn("flex flex-col space-y-1 mx-2 pb-safe", className)}
      style={{ 
        height: mainHeight + 'px',
        maxHeight: '100%',
        paddingBottom: `calc(env(safe-area-inset-bottom) + 0.5rem)`
      }}
    >
      {children}
    </div>
  )
);

GameContainer.displayName = "GameContainer";