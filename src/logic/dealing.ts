import type { Card } from '../types/game';
import { INITIAL_BOARD_SIZE, EXPAND_SIZE } from '../utils/constants';

export function dealCards(deck: Card[]): { board: Card[]; remaining: Card[] } {
  const board = deck.slice(0, INITIAL_BOARD_SIZE);
  const remaining = deck.slice(INITIAL_BOARD_SIZE);
  return { board, remaining };
}

export function replaceCards(
  board: Card[],
  deck: Card[],
  removedIds: number[]
): { board: Card[]; remaining: Card[] } {
  if (board.length > INITIAL_BOARD_SIZE || deck.length === 0) {
    const newBoard = board.filter((c) => !removedIds.includes(c.id));
    return { board: newBoard, remaining: deck };
  }

  let deckIndex = 0;
  const newBoard = board.map((card) => {
    if (removedIds.includes(card.id) && deckIndex < deck.length) {
      return deck[deckIndex++];
    }
    return card;
  });
  const remaining = deck.slice(deckIndex);
  return { board: newBoard, remaining };
}

export function expandBoard(
  board: Card[],
  deck: Card[]
): { board: Card[]; remaining: Card[] } {
  const extra = deck.slice(0, EXPAND_SIZE);
  const remaining = deck.slice(EXPAND_SIZE);
  return { board: [...board, ...extra], remaining };
}
