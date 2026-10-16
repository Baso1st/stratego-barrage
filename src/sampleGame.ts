// A fixed game in progress, shown until the setup phase exists. It's built with the real
// engine, so it's a legal position, and seen from Red's side like the player will see it.
import {
  applyMove,
  createGame,
  placeSetup,
  viewFor,
  type Placement,
  type Square,
} from './game/index.ts'

const sq = (row: number, col: number): Square => ({ row, col })

const RED: Placement[] = [
  { rank: 'flag', square: sq(9, 4) },
  { rank: 'bomb', square: sq(8, 4) },
  { rank: 'marshal', square: sq(6, 5) },
  { rank: 'general', square: sq(6, 1) },
  { rank: 'miner', square: sq(7, 7) },
  { rank: 'scout', square: sq(6, 0) },
  { rank: 'scout', square: sq(6, 9) },
  { rank: 'spy', square: sq(7, 4) },
]

const BLUE: Placement[] = [
  { rank: 'flag', square: sq(0, 6) },
  { rank: 'bomb', square: sq(1, 6) },
  { rank: 'marshal', square: sq(3, 4) },
  { rank: 'general', square: sq(3, 9) },
  { rank: 'miner', square: sq(2, 2) },
  { rank: 'scout', square: sq(3, 0) },
  { rank: 'scout', square: sq(2, 7) },
  { rank: 'spy', square: sq(2, 5) },
]

// A few opening moves, so the board shows every kind of enemy piece: hidden, moved and revealed.
const MOVES: [Square, Square][] = [
  [sq(6, 9), sq(3, 9)], // Red's Scout runs up the edge into Blue's General, and loses
  [sq(3, 4), sq(4, 4)], // Blue's Marshal steps forward
  [sq(6, 5), sq(5, 5)], // Red's Marshal steps forward
  [sq(3, 0), sq(4, 0)], // Blue's Scout steps forward
]

let state = placeSetup(placeSetup(createGame(), 'red', RED), 'blue', BLUE)
for (const [from, to] of MOVES) state = applyMove(state, { from, to }).state

export const sampleView = viewFor(state, 'red')
