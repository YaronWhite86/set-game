import { useReducer } from 'react';
import type { GameState, GameAction } from '../types/game';
import { generateDeck } from '../logic/deck';
import { dealCards, replaceCards, expandBoard } from '../logic/dealing';
import { isValidSet, findAllSets, hasSetOnBoard } from '../logic/setValidation';
import { shuffle } from '../utils/shuffle';
import { CLAIM_TIMEOUT_SECONDS, DEFAULT_SETTINGS } from '../utils/constants';

const initialState: GameState = {
  deck: [],
  board: [],
  selected: [],
  setsFound: 0,
  gameMode: 'single',
  players: [],
  claim: { playerId: null, timeRemaining: 0, active: false },
  gameOver: false,
  hintCardId: null,
  timerEnabled: false,
  elapsedSeconds: 0,
  foundSet: null,
  settings: DEFAULT_SETTINGS,
};

function createPlayers(count: number, names?: string[]): GameState['players'] {
  const keys = ['Q', 'P', 'Z', 'M', '', ''];
  const defaultNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: names?.[i] ?? defaultNames[i],
    score: 0,
    claimKey: names ? '' : (keys[i] ?? ''),
    connected: true,
  }));
}

type Card = GameState['board'][0];

function checkGameOver(board: Card[], deck: Card[]): boolean {
  return deck.length === 0 && !hasSetOnBoard(board);
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const settings = action.settings ?? DEFAULT_SETTINGS;
      const shuffled = shuffle(generateDeck(settings.shapes));
      const { board, remaining } = dealCards(shuffled);
      const playerCount = action.playerCount ?? (action.playerNames?.length ?? 2);
      return {
        ...initialState,
        deck: remaining,
        board,
        gameMode: action.mode,
        timerEnabled: action.timerEnabled,
        settings,
        players: action.mode !== 'single'
          ? createPlayers(playerCount, action.playerNames)
          : [],
      };
    }

    case 'SELECT_CARD': {
      if (state.foundSet) return state;
      if (state.selected.includes(action.cardId)) return state;
      if ((state.gameMode === 'multiplayer' || state.gameMode === 'online') && !state.claim.active) return state;

      const newSelected = [...state.selected, action.cardId];
      if (newSelected.length < 3) {
        return { ...state, selected: newSelected, hintCardId: null };
      }

      // 3 cards selected — validate
      const cards = newSelected.map((id) => state.board.find((c) => c.id === id)!);
      const valid = isValidSet(cards[0], cards[1], cards[2]);

      if (valid) {
        const { board, remaining } = replaceCards(state.board, state.deck, newSelected);
        // Auto-expand if no sets on board and deck has cards
        let finalBoard = board;
        let finalDeck = remaining;
        while (finalDeck.length > 0 && !hasSetOnBoard(finalBoard)) {
          const expanded = expandBoard(finalBoard, finalDeck);
          finalBoard = expanded.board;
          finalDeck = expanded.remaining;
        }
        const isGameOver = checkGameOver(finalBoard, finalDeck);

        return {
          ...state,
          selected: [],
          claim: { playerId: null, timeRemaining: 0, active: false },
          hintCardId: null,
          foundSet: {
            cards,
            pendingBoard: finalBoard,
            pendingDeck: finalDeck,
            pendingGameOver: isGameOver,
            playerId: state.claim.playerId,
          },
        };
      }

      // Invalid set in multiplayer — penalize
      if ((state.gameMode === 'multiplayer' || state.gameMode === 'online') && state.claim.playerId !== null) {
        const updatedPlayers = state.players.map((p) =>
          p.id === state.claim.playerId ? { ...p, score: Math.max(0, p.score - 1) } : p
        );
        return {
          ...state,
          selected: [],
          players: updatedPlayers,
          claim: { playerId: null, timeRemaining: 0, active: false },
          hintCardId: null,
        };
      }

      // Invalid set in single player — just clear
      return { ...state, selected: [], hintCardId: null };
    }

    case 'DESELECT_CARD': {
      return {
        ...state,
        selected: state.selected.filter((id) => id !== action.cardId),
        hintCardId: null,
      };
    }

    case 'DISMISS_FOUND_SET': {
      if (!state.foundSet) return state;
      const { pendingBoard, pendingDeck, pendingGameOver, playerId } = state.foundSet;

      let updatedPlayers = state.players;
      if ((state.gameMode === 'multiplayer' || state.gameMode === 'online') && playerId !== null) {
        updatedPlayers = state.players.map((p) =>
          p.id === playerId ? { ...p, score: p.score + 1 } : p
        );
      }

      return {
        ...state,
        board: pendingBoard,
        deck: pendingDeck,
        setsFound: state.setsFound + 1,
        players: updatedPlayers,
        gameOver: pendingGameOver,
        foundSet: null,
      };
    }

    case 'CLAIM': {
      if (state.foundSet) return state;
      if (state.claim.active) return state;
      return {
        ...state,
        claim: {
          playerId: action.playerId,
          timeRemaining: CLAIM_TIMEOUT_SECONDS,
          active: true,
        },
        selected: [],
        hintCardId: null,
      };
    }

    case 'CLAIM_TIMEOUT': {
      if (!state.claim.active || state.claim.playerId === null) return state;
      const updatedPlayers = state.players.map((p) =>
        p.id === state.claim.playerId ? { ...p, score: Math.max(0, p.score - 1) } : p
      );
      return {
        ...state,
        selected: [],
        players: updatedPlayers,
        claim: { playerId: null, timeRemaining: 0, active: false },
      };
    }

    case 'ADD_CARDS': {
      if (state.deck.length === 0) return state;
      const { board, remaining } = expandBoard(state.board, state.deck);
      return { ...state, board, deck: remaining };
    }

    case 'TICK_TIMER': {
      if (state.claim.active && state.claim.timeRemaining > 0) {
        const newTime = state.claim.timeRemaining - 1;
        if (newTime <= 0) {
          // Will be handled by CLAIM_TIMEOUT dispatched from hook
          return {
            ...state,
            claim: { ...state.claim, timeRemaining: 0 },
          };
        }
        return {
          ...state,
          claim: { ...state.claim, timeRemaining: newTime },
          elapsedSeconds: state.timerEnabled ? state.elapsedSeconds + 1 : state.elapsedSeconds,
        };
      }
      return {
        ...state,
        elapsedSeconds: state.timerEnabled ? state.elapsedSeconds + 1 : state.elapsedSeconds,
      };
    }

    case 'HINT': {
      const sets = findAllSets(state.board);
      if (sets.length > 0) {
        return { ...state, hintCardId: sets[0][0].id };
      }
      return state;
    }

    case 'RESET': {
      return initialState;
    }

    default:
      return state;
  }
}

export function useGameState() {
  return useReducer(gameReducer, initialState);
}
