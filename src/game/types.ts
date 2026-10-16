/** The two sides. You always play Red; the computer plays Blue. */
export type Player = 'red' | 'blue'

export type Rank = 'marshal' | 'general' | 'miner' | 'scout' | 'spy' | 'bomb' | 'flag'

/** A square on the board. Row 0 is the computer's back row and row 9 is yours. */
export interface Square {
  readonly row: number
  readonly col: number
}

export interface Piece {
  /** Stays the same all game, e.g. `red-scout-2`, so the UI can follow a piece as it moves. */
  readonly id: string
  readonly owner: Player
  readonly rank: Rank
  /** Whether the opponent knows its rank. Set once it has fought, and never unset. */
  readonly revealed: boolean
  /** Whether it has ever moved, which tells the opponent it isn't a Bomb or the Flag. */
  readonly hasMoved: boolean
}

/** Indexed `board[row][col]`. `null` is an empty square; lakes are always empty. */
export type Board = readonly (readonly (Piece | null)[])[]

export interface Move {
  readonly from: Square
  readonly to: Square
}

/** Where one piece goes during setup. */
export interface Placement {
  readonly rank: Rank
  readonly square: Square
}

export type Phase = 'setup' | 'playing' | 'over'

export interface GameResult {
  /** `null` for a draw. */
  readonly winner: Player | null
  readonly reason: 'flag' | 'no-moves' | 'draw'
}

export interface GameState {
  readonly board: Board
  readonly phase: Phase
  /** Whose move it is while playing. */
  readonly turn: Player
  readonly history: readonly Move[]
  readonly captured: readonly Piece[]
  readonly result?: GameResult
}
