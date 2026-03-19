export type Shape = 'diamond' | 'oval' | 'star' | 'heart' | 'cross' | 'arrow';
export type Color = 'red' | 'green' | 'purple';
export type NumberCount = 1 | 2 | 3;
export type Shading = 'solid' | 'striped' | 'empty';

export type ColorPalette = 'classic' | 'ocean' | 'sunset' | 'neon';

export interface GameSettings {
  shapes: Shape[];          // exactly 3
  colorPalette: ColorPalette;
}

export interface Card {
  id: number;
  shape: Shape;
  color: Color;
  number: NumberCount;
  shading: Shading;
}

export type GameMode = 'single' | 'multiplayer' | 'online';
export type Screen = 'menu' | 'game' | 'gameover' | 'lobby';

export interface Player {
  id: number;
  name: string;
  score: number;
  claimKey: string;
  connected?: boolean;
}

export interface ClaimState {
  playerId: number | null;
  timeRemaining: number;
  active: boolean;
}

export interface FoundSet {
  cards: Card[];          // the 3 matched cards to display
  pendingBoard: Card[];   // board after replacement + auto-expansion
  pendingDeck: Card[];    // deck after replacement + auto-expansion
  pendingGameOver: boolean;
  playerId: number | null; // who found it (multiplayer)
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
  foundSet: FoundSet | null;
  settings: GameSettings;
}

export type GameAction =
  | { type: 'START_GAME'; mode: GameMode; timerEnabled: boolean; playerCount?: number; playerNames?: string[]; settings?: GameSettings }
  | { type: 'SELECT_CARD'; cardId: number }
  | { type: 'DESELECT_CARD'; cardId: number }
  | { type: 'CLAIM'; playerId: number }
  | { type: 'CLAIM_TIMEOUT' }
  | { type: 'ADD_CARDS' }
  | { type: 'TICK_TIMER' }
  | { type: 'HINT' }
  | { type: 'DISMISS_FOUND_SET' }
  | { type: 'RESET' };
