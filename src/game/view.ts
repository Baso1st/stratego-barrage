import type { GameState, Player, PlayerView } from './types.ts'

/**
 * The game as `player` is allowed to see it: the opponent's pieces that haven't been revealed
 * have no rank. Once the game is over, every piece is shown.
 */
export function viewFor(state: GameState, player: Player): PlayerView {
  const board = state.board.map((cells) =>
    cells.map((piece) => {
      if (!piece) return null
      const hidden = piece.owner !== player && !piece.revealed && state.phase !== 'over'
      return hidden ? { ...piece, rank: null } : piece
    }),
  )
  return { ...state, player, board }
}
