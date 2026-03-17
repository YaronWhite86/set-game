import { useCallback } from 'react';
import { GameContext } from './gameContextValue';
import { useGameState } from '../hooks/useGameState';
import { useTimer } from '../hooks/useTimer';
import { useMultiplayer } from '../hooks/useMultiplayer';

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

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
