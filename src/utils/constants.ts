import type { Shape, Color, NumberCount, Shading, ColorPalette, GameSettings } from '../types/game';

export const SHAPES: Shape[] = ['diamond', 'oval', 'star'];
export const ALL_SHAPES: Shape[] = ['diamond', 'oval', 'star', 'heart', 'cross', 'arrow'];
export const SHAPE_PRESETS: Record<string, Shape[]> = {
  classic: ['diamond', 'oval', 'star'],
  bold: ['heart', 'cross', 'arrow'],
};
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

export const COLOR_PALETTES: Record<ColorPalette, Record<Color, string>> = {
  classic: { red: '#d40000', green: '#008040', purple: '#5b2e91' },
  ocean: { red: '#1a5276', green: '#17a589', purple: '#e67e22' },
  sunset: { red: '#c0392b', green: '#d35400', purple: '#f1c40f' },
  neon: { red: '#ff1493', green: '#00d4ff', purple: '#39ff14' },
};

export const COLOR_VALUES: Record<Color, string> = COLOR_PALETTES.classic;

export const DEFAULT_SETTINGS: GameSettings = {
  shapes: ['diamond', 'oval', 'star'],
  colorPalette: 'classic',
};
