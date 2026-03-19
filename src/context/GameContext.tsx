import { useCallback, useEffect } from 'react';
import { GameContext } from './gameContextValue';
import { useGameState } from '../hooks/useGameState';
import { useTimer } from '../hooks/useTimer';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { FOUND_SET_DISPLAY_MS } from '../utils/constants';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useGameState();

  const onTick = useCallback(() => {
    dispatch({ type: 'TICK_TIMER' });
  }, [dispatch]);

  useTimer(
    state.timerEnabled && state.gameMode === 'single',
    state.gameOver,
    onTick
  );

  useMultiplayer(state, dispatch);

  // Auto-dismiss found set after display duration
  useEffect(() => {
    if (!state.foundSet || state.paused) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'DISMISS_FOUND_SET' });
    }, FOUND_SET_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [state.foundSet, state.paused, dispatch]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
