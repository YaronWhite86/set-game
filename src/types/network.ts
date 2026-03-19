import type { Card, ClaimState, GameMode, GameSettings, Player } from './game';

/** foundSet as seen by peers — no pendingDeck (anti-cheat) */
export interface PeerFoundSet {
  cards: Card[];
  pendingBoard: Card[];
  pendingGameOver: boolean;
  playerId: number | null;
}

/** GameState as seen by peers — no deck (anti-cheat), includes deckSize */
export interface PeerGameState {
  board: Card[];
  selected: number[];
  setsFound: number;
  gameMode: GameMode;
  players: Player[];
  claim: ClaimState;
  gameOver: boolean;
  hintCardId: number | null;
  timerEnabled: boolean;
  elapsedSeconds: number;
  deckSize: number;
  foundSet: PeerFoundSet | null;
  settings: GameSettings;
}

export interface LobbyPlayer {
  id: string; // peerId
  name: string;
  connected: boolean;
  playerId: number; // assigned game player index
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RoomState {
  roomCode: string;
  isHost: boolean;
  localPlayerId: number;
  localPlayerName: string;
  connectionStatus: ConnectionStatus;
  lobbyPlayers: LobbyPlayer[];
  error: string | null;
}

// Messages from peer to host
export type PeerToHostMessage =
  | { type: 'PLAYER_INFO'; name: string }
  | { type: 'CLAIM'; playerId: number }
  | { type: 'SELECT_CARD'; cardId: number }
  | { type: 'DESELECT_CARD'; cardId: number };

// Messages from host to peers
export type HostToPeerMessage =
  | { type: 'STATE_UPDATE'; state: PeerGameState }
  | { type: 'PLAYER_ASSIGNED'; playerId: number }
  | { type: 'GAME_STARTED' }
  | { type: 'LOBBY_UPDATE'; players: LobbyPlayer[] }
  | { type: 'HOST_DISCONNECTED' }
  | { type: 'ERROR'; message: string };
