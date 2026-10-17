// Helpers for setting up game positions in tests.
import {
  ARMY,
  BOARD_SIZE,
  applyMove,
  createGame,
  legalMoves,
  placeSetup,
  randomSetup,
  sameSquare,
  type GameState,
  type Move,
  type Piece,
  type Player,
  type Rank,
  type Rng,
  type Square,
} from '../game/index.ts'

/** A piece on a square, for `position`. */
export interface Placed {
  readonly square: Square
  readonly piece: Piece
}

function placed(owner: Player, rank: Rank, row: number, col: number, extra: Partial<Piece>): Placed {
  return {
    square: { row, col },
    piece: { id: `${owner}-${row}-${col}`, owner, rank, revealed: false, hasMoved: false, ...extra },
  }
}

/** One of your pieces, e.g. `red('general', 7, 4, { revealed: true })`. */
export const red = (rank: Rank, row: number, col: number, extra: Partial<Piece> = {}) =>
  placed('red', rank, row, col, extra)

/** One of the computer's pieces. */
export const blue = (rank: Rank, row: number, col: number, extra: Partial<Piece> = {}) =>
  placed('blue', rank, row, col, extra)

/**
 * A game being played with just these pieces on the board, and Red to move unless `state`
 * says otherwise. Each army's other pieces count as captured, so the position is one that
 * could really happen, which matters to the computer's guesses about hidden ranks.
 */
export function position(pieces: readonly Placed[], state: Partial<GameState> = {}): GameState {
  const board = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => pieces.find((p) => sameSquare(p.square, { row, col }))?.piece ?? null),
  )
  const captured = (['red', 'blue'] as const).flatMap((owner) =>
    (Object.keys(ARMY) as Rank[]).flatMap((rank) => {
      const onBoard = pieces.filter(({ piece }) => piece.owner === owner && piece.rank === rank).length
      return Array.from({ length: Math.max(0, ARMY[rank] - onBoard) }, (_, i) => ({
        id: `${owner}-captured-${rank}-${i}`,
        owner,
        rank,
        revealed: true,
        hasMoved: rank !== 'bomb' && rank !== 'flag',
      }))
    }),
  )
  return { board, phase: 'playing', turn: 'red', history: [], captured, ...state }
}

/** A game just after both sides have set up at random. */
export function randomGame(rng: Rng): GameState {
  return placeSetup(placeSetup(createGame(), 'red', randomSetup('red', rng)), 'blue', randomSetup('blue', rng))
}

/** A random legal move for whoever's turn it is. */
export function randomMove(state: GameState, rng: Rng): Move {
  const moves = legalMoves(state)
  return moves[Math.floor(rng() * moves.length)]
}

/** Plays random moves until the game ends or `limit` moves have been played, calling `each` before every move. */
export function playRandomly(state: GameState, rng: Rng, limit: number, each?: (state: GameState) => void): GameState {
  let current = state
  for (let i = 0; i < limit && current.phase === 'playing'; i++) {
    each?.(current)
    current = applyMove(current, randomMove(current, rng)).state
  }
  return current
}
