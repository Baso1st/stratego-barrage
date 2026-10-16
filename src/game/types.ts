/** The two sides. You always play Red; the computer plays Blue. */
export type Player = 'red' | 'blue'

export type Rank = 'marshal' | 'general' | 'miner' | 'scout' | 'spy' | 'bomb' | 'flag'

/** A square on the board. Row 0 is the computer's back row and row 9 is yours. */
export interface Square {
  readonly row: number
  readonly col: number
}

export interface Piece {
  /**
   * Stays the same all game, so the UI can follow a piece as it moves. It's named after the
   * piece's starting square, e.g. `red-6-4`, which both players saw, so it never gives away the rank.
   */
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
  /** Every move played, in order. Red moves first, so Red's are the even-numbered ones. */
  readonly history: readonly Move[]
  /** Pieces removed in fights. They all fought, so they're all revealed. */
  readonly captured: readonly Piece[]
  readonly result?: GameResult
}

/** Who comes out of a fight. */
export type CombatResult = 'attacker-wins' | 'defender-wins' | 'both-lose'

/** What a move did, for the UI to show. Events never include a rank that's still hidden. */
export type GameEvent =
  | { readonly type: 'moved'; readonly pieceId: string; readonly from: Square; readonly to: Square }
  | {
      readonly type: 'combat'
      readonly from: Square
      readonly to: Square
      /** Both pieces as revealed by the fight. */
      readonly attacker: Piece
      readonly defender: Piece
      readonly result: CombatResult
    }
  | { readonly type: 'game-over'; readonly result: GameResult }

/** A piece as one player sees it. */
export interface PieceView extends Omit<Piece, 'rank'> {
  /** `null` for an opponent's piece that hasn't been revealed. */
  readonly rank: Rank | null
}

/** The game as one player is allowed to see it. */
export interface PlayerView extends Omit<GameState, 'board'> {
  readonly player: Player
  readonly board: readonly (readonly (PieceView | null)[])[]
}
