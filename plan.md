# Implementation Plan: GitHub Pages P2P Hosting + Testing Suite

## Part 1: GitHub Pages with P2P Multiplayer

### Goal
Host the Set game on GitHub Pages so anyone can create a P2P game room and share a link with players on any device/network.

### Architecture Overview

```
Player A (Host)                    Player B (Guest)
  Browser  ──── WebRTC DataChannel ────  Browser
     │                                      │
     └──── PeerJS Cloud Signaling ──────────┘
            (free, no server needed)
```

**Key technology choice: PeerJS** — wraps WebRTC with a simple API and provides free signaling/STUN servers. No backend needed; perfect for GitHub Pages static hosting.

### Step-by-step Implementation

#### Step 1: Configure Vite for GitHub Pages
- Add `base` option to `vite.config.ts` (e.g., `base: '/set-game/'` or whatever the repo name is)
- Add a `deploy` script to `package.json`: `"deploy": "npm run build && gh-pages -d dist"`
- Install `gh-pages` as a dev dependency
- Add GitHub Actions workflow (`.github/workflows/deploy.yml`) to auto-deploy on push to main

#### Step 2: Install PeerJS
- `npm install peerjs`
- PeerJS provides: peer ID generation, signaling via PeerJS Cloud, WebRTC DataChannel abstraction

#### Step 3: Create P2P networking layer (`src/network/`)
New files:
- **`src/network/peer.ts`** — PeerJS wrapper
  - `createRoom()`: Creates a new Peer, returns a room ID (the peer ID)
  - `joinRoom(roomId)`: Connects to an existing peer by ID
  - `sendMessage(data)`: Send game actions over DataChannel
  - `onMessage(callback)`: Receive game actions
  - `disconnect()`: Clean up connections
- **`src/network/protocol.ts`** — Message types
  - `SyncState`: Full state snapshot (sent on join)
  - `GameAction`: Forwarded reducer actions (SELECT_CARD, CLAIM, etc.)
  - `PlayerJoined` / `PlayerLeft`: Connection events
  - `Ping/Pong`: Latency tracking (optional)
- **`src/network/hostGuest.ts`** — Host/guest role logic
  - **Host**: Owns the authoritative game state, runs the reducer, broadcasts state changes
  - **Guest**: Sends actions to host, receives state updates, renders received state
  - This host-authoritative model prevents desync and cheating

#### Step 4: Create room management UI
- **New screen: `'lobby'`** added to the Screen type
  - "Create Room" button → generates room ID → shows shareable URL
  - "Join Room" input → paste/enter room ID or URL
  - URL format: `https://<user>.github.io/set-game/#room=<peerId>`
  - Use hash-based routing so GitHub Pages doesn't need server-side routing
- **Lobby screen** shows connected players, their names, ready status
  - Host sees a "Start Game" button when 2+ players connected
  - Players can set their display name

#### Step 5: Integrate P2P with game state
- **`src/hooks/useNetworkGame.ts`** — New hook that bridges P2P and reducer
  - On host: wraps `useGameState`, intercepts dispatch to broadcast actions
  - On guest: receives state from host, provides read-only state + a `sendAction` function
  - Replaces direct `useGameState` when in online mode
- **Modify `GameContext.tsx`**: Support both local and networked game providers
- **Claim system adaptation**: In P2P mode, claims are sent as network messages instead of local keyboard events. Each player presses a single "Claim" button (touch-friendly) rather than player-specific keys.

#### Step 6: Mobile/touch support
- Add a "Claim" button on screen (the keyboard Q/P/Z/M keys don't work on mobile)
- Ensure card grid is responsive (CSS grid with `auto-fit`)
- Touch events already work via React's `onClick`

#### Step 7: Connection resilience
- Handle peer disconnection gracefully (show "Reconnecting..." overlay)
- If host disconnects, show "Host left" and return to menu
- PeerJS auto-reconnect for brief network blips

### Data Flow (P2P Game)

```
1. Host creates room → PeerJS assigns peer ID → URL with #room=<id>
2. Guest opens URL → PeerJS connects to host peer
3. Host sends full GameState snapshot to guest
4. During game:
   - Guest taps "Claim" → sends CLAIM action to host
   - Host reducer processes action → broadcasts new state to all guests
   - Guest taps card → sends SELECT_CARD to host
   - Host validates, updates state, broadcasts
5. Game over: host sends final state, all see results
```

### Dependencies to Add
- `peerjs` (~50KB gzipped) — WebRTC abstraction + free signaling
- `gh-pages` (dev) — GitHub Pages deployment

---

## Part 2: Testing Suite

### Goal
Add a comprehensive testing suite so new additions (especially P2P networking) don't break existing game logic.

### Technology Choice: Vitest
- Native Vite integration (uses same config, same transforms)
- Jest-compatible API (describe/it/expect)
- Fast, supports TypeScript out of the box
- Add `@testing-library/react` + `jsdom` for component tests

### Step-by-step Implementation

#### Step 1: Install testing dependencies
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

#### Step 2: Configure Vitest
- Add `test` config to `vite.config.ts`:
  ```ts
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  }
  ```
- Create `src/test/setup.ts` with `@testing-library/jest-dom` matchers
- Add `"test": "vitest"` and `"test:run": "vitest run"` scripts to `package.json`
- Add `vitest/globals` to tsconfig types

#### Step 3: Unit tests for pure game logic (highest priority)

**`src/logic/__tests__/deck.test.ts`**
- Generates exactly 81 unique cards
- Each card has valid property values (shape, color, number, shading)
- Card IDs are 0-80 with no duplicates

**`src/logic/__tests__/setValidation.test.ts`**
- `isValidSet`: returns true for valid sets (all-same and all-different combos)
- `isValidSet`: returns false for invalid sets
- `findAllSets`: finds correct count of sets for known board configurations
- `findAllSets`: returns empty array when no sets exist
- `hasSetOnBoard`: returns true/false correctly, consistent with `findAllSets`

**`src/logic/__tests__/dealing.test.ts`**
- `dealCards`: returns 12 cards and reduces deck by 12
- `replaceCards`: swaps matched cards correctly when deck has cards
- `replaceCards`: shrinks board when deck is empty
- `replaceCards`: shrinks board when board has >12 cards
- `expandBoard`: adds 3 cards, reduces deck by 3

**`src/utils/__tests__/shuffle.test.ts`**
- Returns array of same length
- Contains same elements (no loss/duplication)
- Does not mutate original array

#### Step 4: Reducer tests

**`src/hooks/__tests__/useGameState.test.ts`**
- Test reducer function directly (import and call with state + action)
- `START_GAME`: initializes with 12 board cards, 69 deck cards, correct player count
- `SELECT_CARD` with valid set: removes cards, replaces from deck, increments setsFound
- `SELECT_CARD` with invalid set: clears selection, penalizes in multiplayer
- `SELECT_CARD` auto-expansion: board expands when no valid sets remain
- `CLAIM`: sets active claim with correct player and timer
- `CLAIM_TIMEOUT`: decrements player score (min 0), clears claim
- `HINT`: sets hintCardId to a card that's part of a valid set
- Game over detection: triggers when deck empty and no valid sets on board

#### Step 5: Component tests (lower priority, add incrementally)

**`src/components/__tests__/Card.test.tsx`**
- Renders correct number of shapes
- Applies selected/highlighted styles
- Calls onClick when clicked
- Disabled state works correctly

**`src/components/__tests__/Board.test.tsx`**
- Renders correct number of cards
- Cards are clickable/unclickable based on claim state

**`src/components/__tests__/Menu.test.tsx`**
- Mode selection works
- Player count controls appear for multiplayer
- Start button dispatches correct action

#### Step 6: Integration tests for game flow

**`src/__tests__/gameFlow.test.ts`**
- Full game simulation: start → select valid sets → game over
- Multiplayer flow: claim → select → score update
- Board never has 0 valid sets while deck has cards (invariant test)

#### Step 7: CI integration
- Add test step to the GitHub Actions deploy workflow
- Tests run before build: `npm run test:run && npm run build`
- Fail deployment if tests fail

### Test file structure
```
src/
├── test/
│   └── setup.ts                          # Test setup (jest-dom matchers)
├── logic/__tests__/
│   ├── deck.test.ts
│   ├── setValidation.test.ts
│   └── dealing.test.ts
├── utils/__tests__/
│   └── shuffle.test.ts
├── hooks/__tests__/
│   └── useGameState.test.ts
├── components/__tests__/
│   ├── Card.test.tsx
│   ├── Board.test.tsx
│   └── Menu.test.tsx
└── __tests__/
    └── gameFlow.test.ts
```

### Priority Order
1. **Pure logic tests** (deck, setValidation, dealing, shuffle) — most value, easiest to write
2. **Reducer tests** — validates all game state transitions
3. **CI integration** — prevents regressions on deploy
4. **Component tests** — add as features are built
5. **Integration tests** — end-to-end game flow verification

---

## Implementation Order (Both Parts Combined)

| Phase | Tasks | Why this order |
|-------|-------|----------------|
| **Phase 1** | Install Vitest, write pure logic tests | Establish safety net before any changes |
| **Phase 2** | Write reducer tests | Ensure state management is locked down |
| **Phase 3** | Configure GitHub Pages deployment | Get the current game live first |
| **Phase 4** | Add PeerJS, build networking layer | Core P2P infrastructure |
| **Phase 5** | Build lobby UI + room sharing | User-facing room creation/joining |
| **Phase 6** | Integrate P2P with game state | Wire networking into existing game |
| **Phase 7** | Mobile/touch adaptations | Make it work on all devices |
| **Phase 8** | Add component + integration tests | Cover new P2P features |
| **Phase 9** | CI pipeline (test → build → deploy) | Automated quality gate |
