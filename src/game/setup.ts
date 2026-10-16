import { emptyBoard, isOnBoard, withPiece } from './board.ts'
import type { Board, GameState, Placement, Player, Rank } from './types.ts'

/** How many of each rank a player has: 8 pieces in all. */
export const ARMY: Readonly<Record<Rank, number>> = {
  marshal: 1,
  general: 1,
  miner: 1,
  scout: 2,
  spy: 1,
  bomb: 1,
  flag: 1,
}

/** The four back rows each player sets up in. */
export const SETUP_ROWS: Readonly<Record<Player, readonly number[]>> = {
  red: [6, 7, 8, 9],
  blue: [0, 1, 2, 3],
}

/** A new game with an empty board, waiting for both players to set up. */
export function createGame(): GameState {
  return { board: emptyBoard(), phase: 'setup', turn: 'red', history: [], captured: [] }
}

/**
 * Why a setup isn't valid, or `null` if it is. A valid setup is exactly the player's army,
 * with each piece on its own square in the player's setup rows.
 */
export function setupError(player: Player, placements: readonly Placement[]): string | null {
  for (const rank of Object.keys(ARMY) as Rank[]) {
    const count = placements.filter((placement) => placement.rank === rank).length
    if (count !== ARMY[rank]) return `Expected ${ARMY[rank]} ${rank}, got ${count}.`
  }

  const used = new Set<string>()
  for (const { rank, square } of placements) {
    if (!isOnBoard(square) || !SETUP_ROWS[player].includes(square.row)) {
      return `The ${rank} at row ${square.row}, column ${square.col} is outside ${player}'s setup rows.`
    }
    const key = `${square.row},${square.col}`
    if (used.has(key)) return `More than one piece is on row ${square.row}, column ${square.col}.`
    used.add(key)
  }

  return null
}

/**
 * Puts a player's pieces on the board. Throws if the setup isn't valid or the player has
 * already set up. Once both players have set up, play starts with Red to move.
 */
export function placeSetup(
  state: GameState,
  player: Player,
  placements: readonly Placement[],
): GameState {
  if (state.phase !== 'setup') throw new Error('The game has already started.')
  if (hasSetUp(state.board, player)) throw new Error(`${player} has already set up.`)
  const error = setupError(player, placements)
  if (error) throw new Error(error)

  let board = state.board
  for (const { rank, square } of placements) {
    board = withPiece(board, square, {
      id: `${player}-${square.row}-${square.col}`,
      owner: player,
      rank,
      revealed: false,
      hasMoved: false,
    })
  }

  const bothSetUp = hasSetUp(board, 'red') && hasSetUp(board, 'blue')
  return { ...state, board, phase: bothSetUp ? 'playing' : 'setup', turn: 'red' }
}

function hasSetUp(board: Board, player: Player): boolean {
  return board.some((cells) => cells.some((piece) => piece?.owner === player))
}
