import { BOARD_SIZE, isLake, isOnBoard, pieceAt, sameSquare } from './board.ts'
import type { GameState, Move, Player, Rank, Square } from './types.ts'

const IMMOVABLE: readonly Rank[] = ['bomb', 'flag']

// A piece can't move back and forth between the same two squares more than this many times in a row.
const BACK_AND_FORTH_LIMIT = 3

const DIRECTIONS: readonly Square[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

/** Every legal move for the player whose turn it is. */
export function legalMoves(state: GameState): Move[] {
  const moves: Move[] = []
  state.board.forEach((cells, row) =>
    cells.forEach((_, col) => moves.push(...legalMovesFrom(state, { row, col }))),
  )
  return moves
}

/**
 * The legal moves for the piece on `from`, if it belongs to the player whose turn it is.
 * A piece steps one square up, down, left or right, and a Scout keeps going along empty
 * squares like a rook. Either can end its move on an enemy piece to attack it. Nothing
 * enters a lake or a square held by its own side, Bombs and the Flag never move, and no
 * piece can go back and forth between the same two squares more than 3 times in a row.
 */
export function legalMovesFrom(state: GameState, from: Square): Move[] {
  const piece = pieceAt(state.board, from)
  if (state.phase !== 'playing' || piece?.owner !== state.turn || IMMOVABLE.includes(piece.rank)) {
    return []
  }

  const range = piece.rank === 'scout' ? BOARD_SIZE : 1
  const moves: Move[] = []
  for (const direction of DIRECTIONS) {
    for (let step = 1; step <= range; step++) {
      const to = { row: from.row + direction.row * step, col: from.col + direction.col * step }
      if (!isOnBoard(to) || isLake(to)) break
      const target = pieceAt(state.board, to)
      if (target?.owner === piece.owner) break
      const move = { from, to }
      if (!exceedsBackAndForthLimit(state.history, piece.owner, move)) moves.push(move)
      // Moving onto an enemy piece attacks it, which ends the move.
      if (target) break
    }
  }
  return moves
}

/** Whether `move` would make a piece's 4th move in a row between the same two squares. */
function exceedsBackAndForthLimit(history: readonly Move[], player: Player, move: Move): boolean {
  // Red moves first, so Red's moves are the even-numbered ones.
  const own = history.filter((_, i) => i % 2 === (player === 'red' ? 0 : 1))
  const sequence = [...own.slice(-BACK_AND_FORTH_LIMIT), move]
  if (sequence.length <= BACK_AND_FORTH_LIMIT) return false
  // Each move undoes the one before it: same piece, same two squares.
  return sequence.every(
    (step, i) =>
      i === 0 ||
      (sameSquare(step.from, sequence[i - 1].to) && sameSquare(step.to, sequence[i - 1].from)),
  )
}
