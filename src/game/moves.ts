import { BOARD_SIZE, isLake, isOnBoard, pieceAt } from './board.ts'
import type { GameState, Move, Rank, Square } from './types.ts'

const IMMOVABLE: readonly Rank[] = ['bomb', 'flag']

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
 * enters a lake or a square held by its own side, and Bombs and the Flag never move.
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
      moves.push({ from, to })
      // Moving onto an enemy piece attacks it, which ends the move.
      if (target) break
    }
  }
  return moves
}
