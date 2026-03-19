import { useEffect, useRef, useCallback } from 'react';
import type { GameAction, GameState } from '../types/game';
import { CLAIM_KEYS } from '../utils/constants';

export function useMultiplayer(
  state: GameState,
  dispatch: React.Dispatch<GameAction>
) {
  const timerRef = useRef<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (state.gameMode !== 'multiplayer' || state.gameOver) return;
      if (e.key === 'Escape') {
        dispatch({ type: 'TOGGLE_PAUSE' });
        return;
      }
      if (state.paused) return;
      const key = e.key.toLowerCase();
      if (key in CLAIM_KEYS) {
        const playerId = CLAIM_KEYS[key];
        if (playerId < state.players.length && !state.claim.active) {
          dispatch({ type: 'CLAIM', playerId });
        }
      }
    },
    [state.gameMode, state.gameOver, state.paused, state.claim.active, state.players.length, dispatch]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Claim countdown timer
  useEffect(() => {
    if (state.claim.active && state.claim.timeRemaining > 0 && !state.paused) {
      timerRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    } else if (state.claim.active && state.claim.timeRemaining <= 0) {
      dispatch({ type: 'CLAIM_TIMEOUT' });
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.claim.active, state.claim.timeRemaining, state.paused, dispatch]);
}
