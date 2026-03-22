# Implementation Plan: GitHub Pages P2P Multiplayer + Testing Suite

## Current State

- **Working**: Single-player game, local multiplayer (keyboard claims Q/P/Z/M), full Set game logic
- **Not implemented**: Online multiplayer, deployment, testing
- **Stack**: React 19 + TypeScript 5.9 + Vite 8, no test framework, no CI/CD

---

## Part 1: P2P Online Multiplayer via GitHub Pages

### Problem

The current multiplayer mode requires all players on the same keyboard. We need any player on any device/network to join via a shareable link — hosted as a static site on GitHub Pages (no backend).

### Solution: WebRTC via PeerJS

```
┌─────────────┐                              ┌─────────────┐
│  Host (A)   │◄──── WebRTC DataChannel ────►│  Guest (B)  │
│  Runs game  │                              │  Sends acts  │
│  reducer    │                              │  Renders     │
└──────┬──────┘                              └──────┬──────┘
       │                                            │
       └────────► PeerJS Cloud Signaling ◄──────────┘
                  (free STUN + signaling)
```

**Why PeerJS**: Simple API over WebRTC, free cloud signaling/STUN servers, ~50KB gzipped, no backend needed. Works on GitHub Pages since it's purely client-side.

**Why host-authoritative**: One player (host) runs the reducer and broadcasts state. Guests send actions and render received state. This prevents desync and makes the logic simple — no conflict resolution needed.

### Implementation Steps

#### 1.1 — GitHub Pages Deployment

**Files to modify:**
- `vite.config.ts` — Add `base: '/set-game/'` (match repo name)
- `package.json` — Add `"deploy"` script

**Files to create:**
- `.github/workflows/deploy.yml` — GitHub Actions workflow:
  ```yaml
  on: push to main
  steps: checkout → setup node → npm ci → npm run test:run → npm run build → deploy to gh-pages
  ```

**Result**: Game live at `https://YaronWhite86.github.io/set-game/`

#### 1.2 — P2P Networking Layer

**New file: `src/network/PeerManager.ts`**
- Class wrapping PeerJS lifecycle
- `createRoom()` → generates peer, returns room ID
- `joinRoom(roomId: string)` → connects DataConnection to host
- `broadcast(data)` → send to all connected peers (host only)
- `send(data)` → send to host (guest only)
- `onMessage(callback)` / `onPeerJoin(callback)` / `onPeerLeave(callback)`
- `destroy()` → cleanup

**New file: `src/network/protocol.ts`**
- TypeScript types for all P2P messages:
  ```ts
  type NetworkMessage =
    | { type: 'SYNC_STATE'; state: GameState }      // host → guest (full state)
    | { type: 'GAME_ACTION'; action: GameAction }    // guest → host (player action)
    | { type: 'PLAYER_JOIN'; player: PlayerInfo }    // bidirectional
    | { type: 'PLAYER_LEAVE'; playerId: number }     // host → guests
    | { type: 'LOBBY_UPDATE'; players: PlayerInfo[] } // host → guests
    | { type: 'GAME_START' }                         // host → guests
  ```

**New file: `src/network/useNetworkGame.ts`** — React hook
- **Host mode**: Wraps local `useReducer`, on every state change broadcasts `SYNC_STATE` to all guests. Listens for `GAME_ACTION` from guests and feeds into reducer.
- **Guest mode**: Holds state in `useState`, replaces it on each `SYNC_STATE`. Provides `sendAction(action)` that sends `GAME_ACTION` to host.
- Exports `{ state, dispatch, isHost, connectedPlayers, roomId }`

#### 1.3 — New Game Mode & Menu Changes

**Modify `src/types/game.ts`:**
- Add `'online'` to `GameMode` type
- Add `Screen` value: `'lobby'`
- Add `PlayerInfo` type: `{ id: string; name: string; isHost: boolean; ready: boolean }`

**Modify `src/components/Menu/Menu.tsx`:**
- Add third option: "Online Multiplayer"
- Online → navigates to lobby screen (not directly to game)

#### 1.4 — Lobby Screen

**New file: `src/components/Lobby/Lobby.tsx`**
- **Host view**: Shows room ID, shareable URL, copy-to-clipboard button, list of connected players, "Start Game" button (enabled when 2+ players)
- **Guest view**: Shows "Connecting..." then player list, "Ready" toggle
- **URL format**: `https://YaronWhite86.github.io/set-game/#room=<peerId>`
- Hash-based routing — `App.tsx` reads `window.location.hash` on mount to auto-join

**New file: `src/components/Lobby/Lobby.css`**

#### 1.5 — Integrate P2P with Game Flow

**Modify `src/App.tsx`:**
- Add `'lobby'` screen case
- On mount: check `window.location.hash` for `#room=<id>` → auto-navigate to lobby as guest
- Pass `isOnline` flag to `GameScreen`

**Modify `src/context/GameContext.tsx`:**
- Accept optional `networkGame` prop
- When online: use `useNetworkGame` instead of `useGameState`
- Dispatch function: in online guest mode, wraps `sendAction` to look like regular dispatch

**Modify `src/components/Board/Board.tsx`:**
- In online mode: each player gets a "Claim" button (replaces keyboard-based Q/P/Z/M)
- Cards still use `onClick` (already touch-friendly)

#### 1.6 — Online Claim System

**Modify `src/hooks/useMultiplayer.ts`:**
- In online mode: disable keyboard listener
- Add `claimForSelf()` function that dispatches `CLAIM` with current player's ID
- Guest calls `claimForSelf()` → sends `GAME_ACTION({ type: 'CLAIM', playerId })` to host
- Host processes claim in reducer, broadcasts updated state

**New UI element in `Board.tsx` or `ClaimBar.tsx`:**
- Large "CLAIM!" button visible on mobile
- Disabled during active claim by another player
- Shows countdown when you've claimed

#### 1.7 — Connection Resilience

- **Guest disconnect**: Host removes player from lobby/game, broadcasts `PLAYER_LEAVE`
- **Host disconnect**: Guests see "Host disconnected" overlay → return to menu
- **Reconnect**: PeerJS handles ICE reconnection for brief blips; for full disconnect, guest must rejoin via URL
- **Late join**: Not supported during active game (only in lobby)

### New Dependencies
| Package | Purpose | Size |
|---------|---------|------|
| `peerjs` | WebRTC abstraction + free signaling | ~50KB gz |

---

## Part 2: Testing Suite

### Problem

No tests exist. Adding P2P networking is a major change that could break existing game logic. Need a safety net.

### Solution: Vitest + React Testing Library

**Why Vitest**: Native Vite integration (same transforms/config), Jest-compatible API, fast, TypeScript support out of the box.

### Implementation Steps

#### 2.1 — Install & Configure

**Install:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Modify `vite.config.ts`:**
```ts
/// <reference types="vitest/config" />
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

**Modify `package.json`** — add scripts:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

**Create `src/test/setup.ts`:**
```ts
import '@testing-library/jest-dom/vitest'
```

**Modify `tsconfig.app.json`** — add `"vitest/globals"` to `compilerOptions.types`

#### 2.2 — Pure Logic Tests (Priority 1)

These are the highest-value, easiest-to-write tests. Pure functions, no React needed.

**`src/logic/__tests__/deck.test.ts`**
| Test | Assertion |
|------|-----------|
| generates 81 cards | `generateDeck().length === 81` |
| all IDs unique | no duplicate IDs in 0-80 |
| all property combos valid | every card has valid shape/color/number/shading |
| covers all combinations | 3×3×3×3 = 81 unique property combos |

**`src/logic/__tests__/setValidation.test.ts`**
| Test | Assertion |
|------|-----------|
| valid set (all different) | 3 cards all-different on every property → true |
| valid set (mixed same/diff) | e.g. same shape, different everything else → true |
| invalid set (2 same 1 diff) | any property with 2 matching + 1 different → false |
| findAllSets on known board | returns expected count |
| findAllSets empty board | returns `[]` |
| hasSetOnBoard consistent | agrees with `findAllSets(cards).length > 0` |

**`src/logic/__tests__/dealing.test.ts`**
| Test | Assertion |
|------|-----------|
| dealCards deals 12 | board.length === 12, deck shrinks by 12 |
| replaceCards swaps in-place | board.length stays 12, matched cards gone |
| replaceCards shrinks (empty deck) | board.length < 12 when deck empty |
| replaceCards shrinks (>12 board) | removes cards without replacement |
| expandBoard adds 3 | board grows by 3, deck shrinks by 3 |

**`src/utils/__tests__/shuffle.test.ts`**
| Test | Assertion |
|------|-----------|
| preserves length | output.length === input.length |
| preserves elements | sorted output === sorted input |
| doesn't mutate input | original array unchanged |

#### 2.3 — Reducer Tests (Priority 2)

**`src/hooks/__tests__/gameReducer.test.ts`**

Import the reducer function directly and test state transitions:

| Test | Action | Assertion |
|------|--------|-----------|
| START_GAME (single) | `START_GAME` | 12 board, 69 deck, 0 players |
| START_GAME (multi) | `START_GAME` w/ 3 players | 3 players created, scores 0 |
| valid set found | 3 `SELECT_CARD` (valid) | setsFound++, cards replaced |
| invalid set (single) | 3 `SELECT_CARD` (invalid) | selection cleared |
| invalid set (multi) | 3 `SELECT_CARD` (invalid) | player score -1 |
| auto-expand | valid set leaves no sets | board expands |
| game over | deck empty + no sets | `gameOver === true` |
| CLAIM | `CLAIM` | claim active, timer 10 |
| CLAIM_TIMEOUT | `CLAIM_TIMEOUT` | score -1, claim cleared |
| HINT | `HINT` | hintCardId in valid set |
| RESET | `RESET` | back to initial state |
| score floor | timeout at score 0 | score stays 0 |

#### 2.4 — Component Tests (Priority 3)

**`src/components/__tests__/Card.test.tsx`**
- Renders correct number of SVG shapes (1, 2, or 3)
- Shows selected state CSS class
- Calls onClick handler
- Disabled prop prevents clicks

**`src/components/__tests__/Board.test.tsx`**
- Renders 12 cards from state
- Cards disabled when no active claim (multiplayer)

**`src/components/__tests__/Menu.test.tsx`**
- Renders mode selection buttons
- Multiplayer shows player count selector
- Start dispatches correct action

#### 2.5 — Integration Tests (Priority 4)

**`src/__tests__/gameFlow.test.ts`**
- Simulate full game: start → find valid sets on board → select them → repeat until game over
- Verify invariant: board always has a valid set while deck has cards
- Multiplayer flow: claim → select 3 → score updates

#### 2.6 — CI Integration

**`.github/workflows/deploy.yml`** (same file as deployment):
```yaml
- run: npm run test:run    # fail-fast if tests break
- run: npm run build
- deploy to GitHub Pages
```

### Test File Structure
```
src/
├── test/
│   └── setup.ts
├── logic/__tests__/
│   ├── deck.test.ts
│   ├── setValidation.test.ts
│   └── dealing.test.ts
├── utils/__tests__/
│   └── shuffle.test.ts
├── hooks/__tests__/
│   └── gameReducer.test.ts
├── components/__tests__/
│   ├── Card.test.tsx
│   ├── Board.test.tsx
│   └── Menu.test.tsx
└── __tests__/
    └── gameFlow.test.ts
```

---

## Combined Implementation Phases

| Phase | What | Depends On | Deliverable |
|-------|------|------------|-------------|
| **1** | Vitest setup + pure logic tests | Nothing | Safety net for game logic |
| **2** | Reducer + component tests | Phase 1 | Full test coverage of existing code |
| **3** | GitHub Pages deployment | Nothing | Game live at `*.github.io/set-game/` |
| **4** | PeerJS networking layer | Phase 3 | `PeerManager`, protocol types, `useNetworkGame` |
| **5** | Lobby UI + room sharing | Phase 4 | Create/join rooms via shareable URL |
| **6** | Online game integration | Phase 4+5 | Full P2P gameplay with host-authoritative state |
| **7** | Mobile claim button + responsive | Phase 6 | Touch-friendly multiplayer on any device |
| **8** | Tests for P2P features | Phase 6+7 | Network mock tests, lobby tests |
| **9** | CI pipeline | Phase 1+3 | Auto test → build → deploy on push |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| PeerJS cloud signaling goes down | Can self-host PeerServer (npm package) as fallback |
| WebRTC blocked by strict firewalls | PeerJS uses TURN relay as fallback; document limitation |
| State desync between host/guest | Host-authoritative model: guest state is always overwritten by host |
| Large state snapshots slow | GameState is small (~5KB); no optimization needed |
| Mobile browser WebRTC support | WebRTC supported on all modern mobile browsers (iOS 11+, Android 5+) |
