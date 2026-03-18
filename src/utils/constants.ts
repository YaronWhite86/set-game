import type { Shape, Color, NumberCount, Shading } from '../types/game';

export const SHAPES: Shape[] = ['diamond', 'squiggle', 'oval'];
export const COLORS: Color[] = ['red', 'green', 'purple'];
export const NUMBERS: NumberCount[] = [1, 2, 3];
export const SHADINGS: Shading[] = ['solid', 'striped', 'empty'];

export const INITIAL_BOARD_SIZE = 12;
export const EXPAND_SIZE = 3;

export const CLAIM_TIMEOUT_SECONDS = 10;

export const CLAIM_KEYS: Record<string, number> = {
  q: 0,
  p: 1,
  z: 2,
  m: 3,
};

export const MAX_ONLINE_PLAYERS = 6;
export const PLAYER_NAME_KEY = 'setgame-player-name';
export const ROOM_CODE_LENGTH = 4;
export const PEER_ID_PREFIX = 'setgame-';
export const FOUND_SET_DISPLAY_MS = 1500;

export const COLOR_VALUES: Record<Color, string> = {
  red: '#d40000',
  green: '#008040',
  purple: '#5b2e91',
};
