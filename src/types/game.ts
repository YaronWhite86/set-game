export type Shape = 'diamond' | 'squiggle' | 'oval';
export type Color = 'red' | 'green' | 'purple';
export type NumberCount = 1 | 2 | 3;
export type Shading = 'solid' | 'striped' | 'empty';

export interface Card {
  id: number;
  shape: Shape;
  color: Color;
  number: NumberCount;
  shading: Shading;
}

export type GameMode = 'single' | 'multiplayer';
export type Screen = 'menu' | 'game' | 'gameover';

export interface Player {
  id: number;
  name: string;
  score: number;
  claimKey: string;
}

export interface ClaimState {
  playerId: number | null;
  timeRemaining: number;
  active: boolean;
}

export interface GameState {
  deck: Card[];
  board: Card[];
  selected: number[]; // card ids
  setsFound: number;
  gameMode: GameMode;
  players: Player[];
  claim: ClaimState;
  gameOver: boolean;
  hintCardId: number | null;
  timerEnabled: boolean;
  elapsedSeconds: number;
}

export type GameAction =
  | { type: 'START_GAME'; mode: GameMode; timerEnabled: boolean; playerCount?: number }
  | { type: 'SELECT_CARD'; cardId: number }
  | { type: 'DESELECT_CARD'; cardId: number }
  | { type: 'CLAIM'; playerId: number }
  | { type: 'CLAIM_TIMEOUT' }
  | { type: 'ADD_CARDS' }
  | { type: 'TICK_TIMER' }
  | { type: 'HINT' }
  | { type: 'RESET' };
