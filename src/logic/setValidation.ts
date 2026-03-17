import type { Card } from '../types/game';

function allSameOrAllDifferent(a: string | number, b: string | number, c: string | number): boolean {
  return (a === b && b === c) || (a !== b && b !== c && a !== c);
}

export function isValidSet(a: Card, b: Card, c: Card): boolean {
  return (
    allSameOrAllDifferent(a.shape, b.shape, c.shape) &&
    allSameOrAllDifferent(a.color, b.color, c.color) &&
    allSameOrAllDifferent(a.number, b.number, c.number) &&
    allSameOrAllDifferent(a.shading, b.shading, c.shading)
  );
}

export function findAllSets(cards: Card[]): [Card, Card, Card][] {
  const sets: [Card, Card, Card][] = [];
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidSet(cards[i], cards[j], cards[k])) {
          sets.push([cards[i], cards[j], cards[k]]);
        }
      }
    }
  }
  return sets;
}

export function hasSetOnBoard(cards: Card[]): boolean {
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidSet(cards[i], cards[j], cards[k])) {
          return true;
        }
      }
    }
  }
  return false;
}
