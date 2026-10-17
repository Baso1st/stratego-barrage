# Game design

How the game works and how it's built: the rules, the system design and the UI. We build the game to match this document, and update it whenever a design decision changes. It doesn't track progress; the [roadmap](ROADMAP.md) does that.

The goal is a complete, playable game of Barrage against the computer: set up, play, win or lose, start a new game. This document covers only what we're building now.

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

- **Pure TypeScript,** with no React and no randomness except through a seeded random number generator that's passed in (`createRng`, a small mulberry32 generator). The same inputs always give the same game, which makes tests and bug reports reproducible. The app seeds one generator per session from the browser's `crypto`.
- **Immutable state:** each move returns a new state, which keeps updates predictable and simple to test.
- **All the rules live here,** covered by table-driven unit tests: every combat pairing, Scout lines and attacks, lakes, the back-and-forth limit, setup validation and game-over conditions.

The main types and functions. The full set is exported from `src/game/index.ts`:

```ts
type Player = 'red' | 'blue'
type Rank = 'marshal' | 'general' | 'miner' | 'scout' | 'spy' | 'bomb' | 'flag'

interface Piece { id: string; owner: Player; rank: Rank; revealed: boolean; hasMoved: boolean }
// id is the starting square, e.g. 'red-6-4', so it never gives away the rank
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

createRng(seed): Rng                                // seeded random numbers, like Math.random
createGame(): GameState
randomSetup(player, rng): Placement[]               // a valid setup on random squares
setupError(player, placements): string | null      // why a setup isn't valid, or null
placeSetup(state, player, placements): GameState   // throws if the setup isn't valid
legalMoves(position): Move[]                        // the full game or the mover's own view
legalMovesFrom(position, square): Move[]            // one piece's moves, for highlighting
applyMove(state, move): { state: GameState; events: GameEvent[] }   // throws if the move isn't legal
resolveCombat(attacker, defender): CombatResult     // who wins a fight between two ranks
viewFor(state, player): PlayerView                  // hides the opponent's unrevealed ranks
```

- **Events for the UI:** `applyMove` also returns what happened, for example `moved`, `combat` with both ranks and the outcome, or `game-over`. The UI animates from those events instead of working out what changed.
- **Hidden information:** `viewFor` returns the board as one player is allowed to see it, with the opponent's unrevealed pieces as blank backs. The UI and the AI both get only a `PlayerView`, so **the AI can't cheat by design**. Legal moves never depend on hidden ranks, so `legalMoves` works on a player's own view as well as on the full game.
- **Coordinates:** you're Red, in rows 6–9, at the bottom of the screen. The computer is Blue, in rows 0–3.

### Computer opponent (`src/ai/`)

- **Two functions:** `chooseSetup(rng)` places its pieces, and `chooseMove(view, rng)` picks its next move from what it can see. That keeps the AI separate from the engine and the UI, and testable on its own.
- **Setup:** pick one of four hand-made layouts and mirror it left to right half the time, for 8 variations. The Flag is always in the back rows; the Bomb guards it in some layouts and is a decoy elsewhere in others, as a bluff. The layouts are "guarded corner", "decoy bomb", "center fortress" and "behind the lake".
- **Moves, by rules of thumb:** score every legal move and play the best one, breaking ties at random. The rules:
  - attack pieces known to be weaker;
  - move away from pieces known to be stronger;
  - use Scouts to uncover unknown pieces;
  - keep the Marshal away from a possible Spy;
  - guard the Flag.
- **How a move is scored:**
  - **Guessing hidden ranks:** for each enemy piece it can't see, the computer works out how likely each rank is. It goes by the ranks it has seen, the pieces that have been captured, and which pieces have moved: a piece that has moved can't be a Bomb or the Flag.
  - **Piece values:** Flag 300, Marshal 100, General 80, Spy 55, Miner 45, Bomb 25, Scout 15.
  - **Attacks:** an attack is worth what it expects to take, less what it expects to lose, over every rank the target could be.
  - **Danger:** a piece next to an enemy that could beat it is at risk, by the chance of losing times its value; a tie counts as half. Moving out of danger earns that much, and moving into danger costs it. This is what makes it back away from stronger pieces and keeps the Marshal away from a possible Spy.
  - **Scouting:** a Scout gets a bonus for attacking an unknown piece.
  - **The Flag:** a move that would let the enemy take the Flag next turn costs the Flag's value times the chance. That threat is an enemy next to the Flag that can move, or a Scout with a clear line to it. When enemies come within 3 squares of the Flag, attacking them earns a bonus and pieces are drawn back toward it.
  - **Advancing:** pieces are drawn toward the enemy piece most worth attacking, more strongly the closer it is, and get a small bonus for each row they move forward. The Spy stays back.
- **One difficulty level** for everyone.
- **Runs in the page:** no Web Worker.

### React state

A `useReducer` (`src/gameReducer.ts`) wraps the engine, so the engine *is* the reducer logic. We don't need a state library.

- **Three actions:** `start` places both setups, `move` plays a move for whoever's turn it is (keeping the events it returned for the UI), and `new-game` goes back to setup.
- **The reducer stays pure:** anything random, like the computer's setup or its move, is decided before dispatching.
- **The computer's turn** is an effect in `App`: when it's Blue's turn, it waits, asks the AI for a move from Blue's view, and dispatches it.

## 3. UI design

- **Look:** modern and flat. Solid colors, simple shapes, and no textures or 3D effects.
  - Panels, cards and the combat pop-up share one style: solid white, a thin outline and rounded corners, with no shadows.
  - The browser tab shows a red Flag icon in the same style.
- **Mobile first:** the layout is designed for a phone held upright, then scales up for tablets and desktops.
- **Touch and mouse:** every action is a tap or a click and works the same either way. Nothing depends on hovering, because touch screens have no hover.
- **Styled with Tailwind CSS,** using the official Vite plugin. The game's colors (red, blue, water, board) are defined once as Tailwind theme colors. Tailwind is mobile first too: plain classes style the phone layout, and `md:` and `lg:` classes adjust it for bigger screens.

### Flow

**New game** → **Setup** → **Play** → **Game over** → **New game**.

### Layout

- **Phone (upright):** the board fills the screen width. The status line sits above it, and the army panel or setup tray sits below it.
- **Desktop and tablet** (768px wide and up, Tailwind's `md:`): the panel moves beside the board, and its pieces sit 4 to a row so they're a comfortable size. The board grows as large as the window's height allows, up to 640px.

### Board

- **Built as** a 10×10 CSS grid of tappable squares.
- **Square size:** squares are as large as the screen width allows. On a 360px-wide phone that's about 34px, a little under the usual 44px touch-target guideline. That's fine for tap-to-select, tap-to-move with clear highlights.
- **Taps respond instantly:** double-tap zoom is turned off on the board.
- **Lakes** are each drawn as one 2×2 pool of water, and your side is always at the bottom.
- **Moves animate:** a piece slides from its old square to its new one, in 0.4 seconds, for both sides' moves. When a fight is lost, the loser stays on screen until the attacker arrives, then shrinks and fades out over 0.7 seconds: an attacker that loses slides in and fades, and a defender that loses fades from under the winner. Nothing slides or fades if the device asks for reduced motion.

### Pieces

- **Your pieces** show their rank: a number or letter, with an icon from the Lucide icon set above it: Marshal 10 (crown), General 9 (star), Miner 3 (pickaxe), Scout 2 (binoculars), Spy S (mask), Bomb B (bomb), Flag F (flag).
- **Enemy pieces** show a plain back in their color until they're revealed. Revealed pieces stay face-up.
- **Red pieces are rounded squares and Blue pieces are circles,** so the game never depends on telling the colors apart.
- **Pieces scale with the board:** their sizes are a share of the square's width.
- **An enemy piece that has moved gets a small marker,** because it can't be a Bomb or the Flag. The AI remembers that perfectly, so showing it keeps the game fair.

### Setup

- Your four rows are tinted, and a tray below the board holds your 8 pieces. A line above the board counts how many are placed.
- **Placing:** tap a piece in the tray, then a square in your rows. If the square already has a piece, that one goes back to the tray.
- **Rearranging:** tap a placed piece, then another square in your rows to move it there, or another piece to swap the two.
- **The picked-up piece gets an amber ring.** Tapping outside your rows puts it down.
- **Buttons:** **Randomize** puts all 8 pieces on random squares in your rows, **Clear** empties the board, and **Start** is enabled once all 8 pieces are placed.
- **The computer sets up when you press Start,** so its layout can't be seen while you place yours.

### Playing

- **The status line** above the board says "Your move." or "The computer is thinking…", and the result once the game ends.
- **Moving:** tap one of your pieces that can move, and it gets an amber ring. Empty squares it can move to get an amber dot, and enemy pieces it can attack get an amber ring. Tap a target to move there; tap the piece again, or anywhere else, to put it down.
- **For screen readers,** every square has a name: a piece names itself ("Red General", "Blue piece"), an empty square says where it is, a square the picked-up piece can move to is "Move here", and an enemy piece it can attack is "Attack Blue piece".
- **The last move is tinted:** both of its squares get a pale amber background, so you can see what the computer just did.
- **Combat** pops up over the board for 4 seconds, fading in and out: both pieces face-up with the loser faded, and what happened in words, for example "Your General (9) attacks enemy Miner (3): your General wins." It sits at the top or bottom of the board, whichever is away from the fight, so the fight itself stays in view. Taps go through it to the board.
- **The army panel** below the board shows both armies, with captured pieces faded and a count like "Enemy: 6 of 8 left". In Barrage, knowing what's left matters a lot.
- **The computer's turn:** it waits 0.8 seconds before moving, or 4.8 seconds after a fight so the pop-up can be read first. You can't move while it's thinking.

### Game over

- A card takes the place of the status line. It shows who won and why, for example "You win! You captured the enemy Flag.", next to a **New game** button that goes back to setup.
- The whole enemy army is revealed on the board.

## 4. Testing

Vitest runs two sets of tests, set up as projects in `vite.config.ts`. Tests sit next to the code they test.

- **Logic** (`*.test.ts`, in Node): unit tests for the engine, the computer opponent and the app's reducer. This is where most of the tests live.
  - **Engine:** combat, legal moves (including Scouts, lakes and the back-and-forth limit), applying moves, win, loss and draw, setup, each player's view, and the random number generator. Random games played to the end check that the engine always finishes a game and that legal moves are the same from the full game and from the mover's own view.
  - **Computer opponent:** one small position for each rule of thumb, checking it makes the move the rule calls for. Its setups are always valid and use all 8 variations. It only ever plays legal moves, it plays the same whatever Red's unseen pieces really are, and it beats a random player in at least 36 of 40 games.
  - **Positions** are built with helpers in `src/test/positions.ts`, like `position([red('general', 7, 4), blue('flag', 0, 0)])`. Any piece left off the board counts as captured, so every position is one that could really happen.
- **UI** (`*.test.tsx`, in jsdom): component tests with Testing Library and user-event for the key interactions. They cover placing, moving, Randomize, Clear and Start in setup; picking up and moving a piece, the fight pop-up, the army panel and game over in play; and a whole turn with the computer in the app.
  - The tests find things the way a screen reader would, by role and name.
  - jsdom can't run animations, so the setup file (`src/test/setup.ts`) reports that the user prefers reduced motion, and nothing animates.
  - Timers (the pop-up, the computer's pause) are controlled with Vitest's fake timers.

## 5. Open questions

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
- The computer sets up when you press Start, so its layout can't be seen while you place yours.

**UI**
- Mobile first, with touch and mouse: tap or click to select, then to move. No keyboard controls and no drag-and-drop.
- Modern flat visual style.
- Styled with Tailwind CSS.
- Rank icons come from the Lucide icon set.

**Scope**
- This document covers only what we're building now. Ideas for the future stay out of it.
