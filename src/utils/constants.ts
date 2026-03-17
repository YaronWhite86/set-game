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

export const COLOR_VALUES: Record<Color, string> = {
  red: '#e74c3c',
  green: '#27ae60',
  purple: '#8e44ad',
};
