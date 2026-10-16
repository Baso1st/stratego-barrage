# Plan: Game design

**Status:** Building. Step 1 of the [build order](#5-build-order), the engine basics, is done. Every choice made so far is listed in [Decisions](#decisions).

The goal is a complete, playable game of Barrage against the computer: set up, play, win or lose, start a new game. This plan covers only what we're building now: the rules, the system design and the UI.

## 1. Rules

### Board and pieces

The board is 10×10. Each side sets up its 8 pieces anywhere in its own four back rows. The two lakes in the middle can't be entered or crossed.

```
     0 1 2 3 4 5 6 7 8 9
  0  . . . . . . . . . .  ┐
  1  . . . . . . . . . .  │ computer's setup rows
  2  . . . . . . . . . .  │
  3  . . . . . . . . . .  ┘
  4  . . ~ ~ . . ~ ~ . .  lakes
  5  . . ~ ~ . . ~ ~ . .
  6  . . . . . . . . . .  ┐
  7  . . . . . . . . . .  │ your setup rows
  8  . . . . . . . . . .  │
  9  . . . . . . . . . .  ┘
```

| Piece | Rank | Count | Moves |
| --- | --- | --- | --- |
| Marshal | 10 | 1 | 1 square |
| General | 9 | 1 | 1 square |
| Miner | 3 | 1 | 1 square |
| Scout | 2 | 2 | Any distance in a straight line |
| Spy | S | 1 | 1 square |
| Bomb | B | 1 | Never moves |
| Flag | F | 1 | Never moves |

### Moving

- You play Red and move first. Players then alternate turns, and a turn is exactly one move.
- A piece moves one square forward, back, left or right. It can't move diagonally, into a lake, or onto its own piece.
- A Scout moves like a rook: any number of empty squares in a straight line, without jumping over pieces or lakes. It can also attack in the same turn, by ending its move on an enemy piece in that line.
- **No endless back-and-forth:** a piece can't move back and forth between the same two squares more than 3 times in a row.

### Combat

Moving onto an enemy piece attacks it. Both ranks are revealed, and:

- **The higher rank wins** and the loser is removed. If the ranks are equal, both are removed.
- **The Spy beats the Marshal**, but only when the Spy attacks. Anything that attacks the Spy wins.
- **Bombs:** a Miner that attacks a Bomb removes it. Anything else that attacks a Bomb is removed, and the Bomb stays.
- **Flag:** attacking the Flag captures it and wins the game.

A piece that survives a fight **stays revealed** for the rest of the game, for both sides.

### Ending the game

- You win by capturing the Flag, or when your opponent has no legal move on their turn.
- If neither side can ever move again, the game is a draw.

## 2. System design

Three layers, with the rules kept apart from React so they're easy to test:

```
 ┌──────────── UI (React) ────────────┐
 │ renders a PlayerView, sends moves  │
 └───────▲──────────────────┬─────────┘
         │ viewFor(state)   │ applyMove(move)
 ┌───────┴──────────────────▼─────────┐        ┌──────── AI ────────┐
 │       Game engine (pure TS)        │◀───────│ sees only its own  │
 │ rules, state, legal moves, combat  │ move   │ PlayerView         │
 └────────────────────────────────────┘        └────────────────────┘
```

### Game engine (`src/game/`)

- **Pure TypeScript,** with no React and no randomness except through a seeded random number generator that's passed in. The same inputs always give the same game, which makes tests and bug reports reproducible.
- **Immutable state:** each move returns a new state, which keeps updates predictable and simple to test.
- **All the rules live here,** covered by table-driven unit tests: every combat pairing, Scout lines and attacks, lakes, the back-and-forth limit, setup validation and game-over conditions.

A first sketch of the types and functions:

```ts
type Player = 'red' | 'blue'
type Rank = 'marshal' | 'general' | 'miner' | 'scout' | 'spy' | 'bomb' | 'flag'

interface Piece { id: string; owner: Player; rank: Rank; revealed: boolean; hasMoved: boolean }
interface Square { row: number; col: number }
interface Move { from: Square; to: Square }

interface GameState {
  board: (Piece | null)[][]
  phase: 'setup' | 'playing' | 'over'
  turn: Player
  history: Move[]          // also used to enforce the back-and-forth limit
  captured: Piece[]
  result?: { winner: Player | null; reason: 'flag' | 'no-moves' | 'draw' }
}

createGame(): GameState
setupError(player, placements): string | null      // why a setup isn't valid, or null
placeSetup(state, player, placements): GameState   // throws if the setup isn't valid
legalMoves(state): Move[]
legalMovesFrom(state, square): Move[]               // one piece's moves, for highlighting
applyMove(state, move): { state: GameState; events: GameEvent[] }
viewFor(state, player): PlayerView                  // hides the opponent's unrevealed ranks
```

- **Events for the UI:** `applyMove` also returns what happened, for example `moved`, `combat` with both ranks and the outcome, or `game-over`. The UI animates from those events instead of working out what changed.
- **Hidden information:** `viewFor` returns the board as one player is allowed to see it, with the opponent's unrevealed pieces as blank backs. The UI and the AI both get only a `PlayerView`, so **the AI can't cheat by design**.
- **Coordinates:** you're Red, in rows 6–9, at the bottom of the screen. The computer is Blue, in rows 0–3.

### Computer opponent (`src/ai/`)

- **Two functions:** `chooseSetup(rng)` places its pieces, and `chooseMove(view, rng)` picks its next move from what it can see. That keeps the AI separate from the engine and the UI, and testable on its own.
- **Setup:** pick one of a few hand-made layouts and vary it randomly. For example, put the Flag in the back row, sometimes guarded by the Bomb and sometimes not, as a bluff.
- **Moves, by rules of thumb:** score every legal move and play the best one, breaking ties at random. The rules:
  - attack pieces known to be weaker;
  - move away from pieces known to be stronger;
  - use Scouts to uncover unknown pieces;
  - keep the Marshal away from a possible Spy;
  - guard the Flag.
- **One difficulty level** for everyone.
- **Runs in the page:** no Web Worker.

### React state

A `useReducer` wraps the engine, so the engine *is* the reducer logic. We don't need a state library.

## 3. UI design

- **Look:** modern and flat. Solid colors, simple shapes, and no textures or 3D effects.
- **Mobile first:** the layout is designed for a phone held upright, then scales up for tablets and desktops.
- **Touch and mouse:** every action is a tap or a click and works the same either way. Nothing depends on hovering, because touch screens have no hover.
- **Styled with Tailwind CSS,** using the official Vite plugin. The game's colors (red, blue, water, board) are defined once as Tailwind theme colors. Tailwind is mobile first too: plain classes style the phone layout, and `md:` and `lg:` classes adjust it for bigger screens.

### Flow

**New game** → **Setup** → **Play** → **Game over** → **New game**.

### Layout

- **Phone (upright):** the board fills the screen width. The turn indicator sits above it, and the side panel or setup tray sits below it.
- **Desktop:** the board grows to a comfortable maximum size, with the side panel beside it.

### Board

- **Built as** a 10×10 CSS grid of tappable squares.
- **Square size:** squares are as large as the screen width allows. On a 360px-wide phone that's about 34px, a little under the usual 44px touch-target guideline. That's fine for tap-to-select, tap-to-move with clear highlights.
- **Taps respond instantly:** double-tap zoom is turned off on the board.
- **Lakes** are drawn as water squares, and your side is always at the bottom.
- **Moves animate:** a piece slides from its old square to its new one.

### Pieces

- **Your pieces** show their rank: a number or letter plus an icon.
- **Enemy pieces** show a plain back in their color until they're revealed. Revealed pieces stay face-up.
- **Red and blue also differ in shape or pattern,** so the game never depends on telling the colors apart.
- **An enemy piece that has moved gets a small marker,** because it can't be a Bomb or the Flag. The AI remembers that perfectly, so showing it keeps the game fair.

### Setup

- Your four rows are highlighted, and a tray below the board holds your 8 pieces.
- Tap a piece in the tray, then a square, to place it. Tap two placed pieces to swap them.
- **Buttons:** **Randomize**, **Clear**, and **Start**, which is enabled once all 8 pieces are placed.

### Playing

- **Moving:** tap one of your movable pieces, and its legal moves light up, with attacks marked differently. Tap a target to move there, or tap anywhere else to cancel.
- **The last move is highlighted,** so you can see what the computer just did.
- **Combat** shows both pieces face-up for about a second, for example "General (9) attacks Miner (3): General wins".
- **The side panel** shows both sides' captured pieces and what the enemy has left. In Barrage, knowing what's left matters a lot.
- **The computer's turn:** a short pause with a "thinking…" indicator, during which you can't move.

### Game over

- Shows who won and why, and reveals the whole enemy army.
- A **New game** button starts over.

## 4. Testing

- **Engine and AI:** Vitest unit tests. This is where most of the tests live.
- **UI:** Testing Library and jsdom for component tests of the key interactions: placing pieces, and selecting and moving.

## 5. Build order

Each step is a small PR that keeps `main` working.

1. **Engine basics:** the types, the board, setup, and legal moves (including Scouts and lakes).
2. **Engine combat and game end:** combat, revealing, the back-and-forth limit, and win conditions.
3. **Board UI:** add Tailwind, and render a fixed game state in the phone layout.
4. **Setup UI,** plus the computer's setup.
5. **Play loop:** you move, and the computer plays random legal moves. **This is the first playable release.**
6. **Computer opponent:** replace the random moves with the rules of thumb.
7. **Polish:** animations, the game-over screen, the desktop layout, and the flat visual style throughout.

The tests in [section 4](#4-testing) come after these steps.

## 6. Open questions

None right now.

## Decisions

**Rules**
- Scouts can move and attack in the same turn.
- A piece can't move back and forth between the same two squares more than 3 times in a row.
- Revealed pieces stay revealed for the rest of the game, for both sides.
- You play Red and move first.

**Computer opponent**
- The rules-of-thumb version only, with one default difficulty.
- No Web Worker: the AI runs in the page, because it will eventually move behind an API.

**Game**
- No saved games.
- Game over offers New game only, with no rematch.

**UI**
- Mobile first, with touch and mouse: tap or click to select, then to move. No keyboard controls and no drag-and-drop.
- Modern flat visual style.
- Styled with Tailwind CSS.

**Scope**
- This plan covers only what we're building now. Ideas for the future stay out of it.
