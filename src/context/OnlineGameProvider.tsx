import { useEffect, useCallback, useRef } from 'react';
import { GameContext } from './gameContextValue';
import { useGameState } from '../hooks/useGameState';
import { useMultiplayer } from '../hooks/useMultiplayer';
import type { useOnlineMultiplayer } from '../hooks/useOnlineMultiplayer';
import type { GameAction } from '../types/game';
import { FOUND_SET_DISPLAY_MS, DEFAULT_SETTINGS } from '../utils/constants';

type OnlineMultiplayer = ReturnType<typeof useOnlineMultiplayer>;

interface OnlineHostProviderProps {
  children: React.ReactNode;
  online: OnlineMultiplayer;
}

export function OnlineHostProvider({ children, online }: OnlineHostProviderProps) {
  const [state, dispatch] = useGameState();
  const prevStateRef = useRef(state);
  const startedRef = useRef(false);

  // Register dispatch so peer messages can dispatch to reducer
  useEffect(() => {
    online.registerHostDispatch(dispatch);
  }, [dispatch, online]);

  // Auto-start game on mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      const names = online.getPlayerNames();
      dispatch({
        type: 'START_GAME',
        mode: 'online',
        timerEnabled: false,
        playerNames: names,
      });
    }
  }, [dispatch, online]);

  // Use multiplayer hook for claim countdown (reuses existing timer logic)
  useMultiplayer(state, dispatch);

  // Auto-dismiss found set after display duration
  useEffect(() => {
    if (!state.foundSet) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'DISMISS_FOUND_SET' });
    }, FOUND_SET_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [state.foundSet, dispatch]);

  // Broadcast state to peers whenever it changes
  useEffect(() => {
    if (state !== prevStateRef.current && state.gameMode === 'online') {
      online.broadcastState(state);
      prevStateRef.current = state;
    }
  }, [state, online]);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        localPlayerId: online.roomState.localPlayerId,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

interface OnlinePeerProviderProps {
  children: React.ReactNode;
  online: OnlineMultiplayer;
}

export function OnlinePeerProvider({ children, online }: OnlinePeerProviderProps) {
  const { peerGameStateAsGameState, selectCardOnline, deselectCardOnline, claimOnline, roomState } = online;

  // Create a dispatch that sends messages to host instead of local reducer
  const peerDispatch = useCallback(
    (action: GameAction) => {
      switch (action.type) {
        case 'SELECT_CARD':
          selectCardOnline(action.cardId);
          break;
        case 'DESELECT_CARD':
          deselectCardOnline(action.cardId);
          break;
        case 'CLAIM':
          claimOnline(action.playerId);
          break;
      }
    },
    [selectCardOnline, deselectCardOnline, claimOnline]
  );

  const fallbackState = {
    deck: [],
    board: [],
    selected: [],
    setsFound: 0,
    gameMode: 'online' as const,
    players: [],
    claim: { playerId: null, timeRemaining: 0, active: false },
    gameOver: false,
    hintCardId: null,
    timerEnabled: false,
    elapsedSeconds: 0,
    foundSet: null,
    paused: false,
    settings: DEFAULT_SETTINGS,
  };

  return (
    <GameContext.Provider
      value={{
        state: peerGameStateAsGameState ?? fallbackState,
        dispatch: peerDispatch,
        localPlayerId: roomState.localPlayerId,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
