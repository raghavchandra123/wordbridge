import { useState, useEffect } from 'react';

export const useViewport = () => {
  const [visualViewport, setVisualViewport] = useState<{ height: number; width: number }>({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const newHeight = window.visualViewport.height;
        const newWidth = window.visualViewport.width;
        console.log('VIEW: Viewport size changed:', { height: newHeight, width: newWidth });
        setVisualViewport({
          height: newHeight,
          width: newWidth,
        });
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return visualViewport;
};