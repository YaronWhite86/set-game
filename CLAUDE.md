# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript type-check (tsc -b) then Vite production build
npm run lint      # ESLint across all files
npm run preview   # Preview production build locally
```

No test framework is configured yet.

## Tech Stack

React 19 + TypeScript 5.9 + Vite 8. Package manager: npm. Uses `verbatimModuleSyntax` — all type-only imports must use `import type`.

## Architecture

### State Management

Single `useReducer` in `src/hooks/useGameState.ts` manages all game state through a `GameState` object and `GameAction` discriminated union (both defined in `src/types/game.ts`). The reducer is wrapped in React Context via `src/context/GameContext.tsx` (provider) and `src/context/gameContextValue.ts` (context object). Components consume state through `src/hooks/useGame.ts`.

Key reducer actions: `START_GAME` (shuffles deck, deals 12 cards), `SELECT_CARD` (auto-validates when 3 selected, handles scoring/penalties), `CLAIM` (multiplayer turn claim), `CLAIM_TIMEOUT`, `HINT` (finds first valid set via `findAllSets`).

### Game Logic (pure functions, no UI)

All in `src/logic/` — separated from React:
- **deck.ts**: Generates 81 cards (3^4 combinations of shape/color/number/shading) with deterministic IDs 0-80
- **setValidation.ts**: `isValidSet(a,b,c)` checks all 4 properties are all-same or all-different. `findAllSets` does brute-force triple loop. `hasSetOnBoard` is early-return variant
- **dealing.ts**: `replaceCards` swaps matched cards in-place (or shrinks board if >12 cards or deck empty). `expandBoard` adds 3 cards

### SVG Card Rendering

Cards render 1-3 SVG shapes using `src/components/Shapes/ShapeRenderer.tsx`. Each shape (Diamond/Squiggle/Oval) is a simple SVG path component. Shading: solid = fill color, empty = transparent fill + stroke, striped = SVG `<pattern>` with rotated lines. Pattern IDs include index to avoid SVG ID collisions.

### Screen Flow

`App.tsx` uses a `Screen` state (`'menu' | 'game' | 'gameover'`). No router — screens switch via state variable. `GameOver` renders inside `GameScreen` when `state.gameOver` is true (detected when deck empty + no valid sets on board).

### Multiplayer Claim System

`src/hooks/useMultiplayer.ts` listens for keyboard events (Q/P/Z/M mapped to players 0-3). A claim gives the player 10 seconds to select 3 cards. Cards are only clickable during an active claim. Valid set = +1 point, invalid or timeout = -1 point (min 0). Claim countdown runs via `TICK_TIMER` action dispatched from an interval in the hook.

### Board Auto-Expansion

After a valid set is found, the reducer auto-expands the board (adding 3 cards at a time) if no valid sets remain and the deck has cards. This prevents dead-board states without player intervention.
