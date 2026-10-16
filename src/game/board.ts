import type { Board, Piece, Square } from './types.ts'

export const BOARD_SIZE = 10

// The two 2×2 lakes in the middle of the board.
const LAKE_ROWS: readonly number[] = [4, 5]
const LAKE_COLS: readonly number[] = [2, 3, 6, 7]

export function isOnBoard({ row, col }: Square): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

export function isLake({ row, col }: Square): boolean {
  return LAKE_ROWS.includes(row) && LAKE_COLS.includes(col)
}

export function sameSquare(a: Square, b: Square): boolean {
  return a.row === b.row && a.col === b.col
}

/**
 * The piece on a square, or `null` if it's empty or off the board. Works on the full board
 * and on a player's view of it.
 */
export function pieceAt<P>(board: readonly (readonly (P | null)[])[], square: Square): P | null {
  return isOnBoard(square) ? board[square.row][square.col] : null
}

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<Piece | null>(BOARD_SIZE).fill(null))
}

/** A copy of the board with `piece` on `square`, or with the square emptied if `piece` is `null`. */
export function withPiece(board: Board, { row, col }: Square, piece: Piece | null): Board {
  return board.map((cells, r) =>
    r === row ? cells.map((cell, c) => (c === col ? piece : cell)) : cells,
  )
}
