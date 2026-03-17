import { useEffect, useRef } from 'react';

export function useTimer(
  enabled: boolean,
  gameOver: boolean,
  onTick: () => void
) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (enabled && !gameOver) {
      intervalRef.current = window.setInterval(onTick, 1000);
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, gameOver, onTick]);
}
