import { BOARD_SIZE, type Placement, type Rank, type Rng } from '../game/index.ts'

// Hand-made layouts for the computer (Blue, rows 0–3, with row 0 at the back), as
// [rank, row, column]. The Bomb guards the Flag in some and is a decoy in others, as a bluff.
const LAYOUTS: readonly (readonly (readonly [Rank, number, number])[])[] = [
  // Guarded corner: the Flag in the back corner, with the Bomb in front of it.
  [
    ['flag', 0, 0],
    ['bomb', 1, 0],
    ['miner', 1, 1],
    ['spy', 2, 4],
    ['scout', 3, 0],
    ['general', 3, 1],
    ['marshal', 3, 5],
    ['scout', 3, 9],
  ],
  // Decoy bomb: the Bomb sits in the middle, far from the Flag.
  [
    ['flag', 0, 9],
    ['bomb', 1, 4],
    ['miner', 2, 1],
    ['spy', 2, 5],
    ['scout', 3, 0],
    ['marshal', 3, 4],
    ['general', 3, 8],
    ['scout', 3, 9],
  ],
  // Center fortress: the Flag in the middle of the back row, with the Bomb in front of it.
  [
    ['flag', 0, 5],
    ['bomb', 1, 5],
    ['spy', 2, 2],
    ['miner', 2, 4],
    ['marshal', 3, 1],
    ['scout', 3, 4],
    ['general', 3, 8],
    ['scout', 3, 9],
  ],
  // Behind the lake: the Flag hides behind a lake, and the Bomb blocks a lane up front.
  [
    ['flag', 0, 3],
    ['miner', 2, 3],
    ['spy', 2, 5],
    ['general', 3, 0],
    ['marshal', 3, 4],
    ['scout', 3, 5],
    ['bomb', 3, 8],
    ['scout', 3, 9],
  ],
]

/** The computer's setup: one of the hand-made layouts, mirrored left to right half the time. */
export function chooseSetup(rng: Rng): Placement[] {
  const layout = LAYOUTS[Math.floor(rng() * LAYOUTS.length)]
  const mirrored = rng() < 0.5
  return layout.map(([rank, row, col]) => ({
    rank,
    square: { row, col: mirrored ? BOARD_SIZE - 1 - col : col },
  }))
}
