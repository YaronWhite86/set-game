import { createContext } from 'react';
import type { GameState, GameAction } from '../types/game';

export interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  localPlayerId?: number;
}

export const GameContext = createContext<GameContextValue | null>(null);
