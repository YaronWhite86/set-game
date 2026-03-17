import type { Card } from '../types/game';
import { SHAPES, COLORS, NUMBERS, SHADINGS } from '../utils/constants';

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (const shape of SHAPES) {
    for (const color of COLORS) {
      for (const number of NUMBERS) {
        for (const shading of SHADINGS) {
          deck.push({ id, shape, color, number, shading });
          id++;
        }
      }
    }
  }
  return deck;
}
