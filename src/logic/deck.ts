import type { Card, Shape } from '../types/game';
import { COLORS, NUMBERS, SHADINGS } from '../utils/constants';

export function generateDeck(shapes: Shape[]): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (const shape of shapes) {
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
