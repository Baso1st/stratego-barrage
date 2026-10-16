import { pieceAt, sameSquare, withPiece } from './board.ts'
import { resolveCombat } from './combat.ts'
import { legalMoves, legalMovesFrom } from './moves.ts'
import type { GameEvent, GameResult, GameState, Move, Player } from './types.ts'

/**
 * Plays a move for the player whose turn it is. Returns the new state, plus what happened for
 * the UI to show. Throws if the move isn't legal.
 */
export function applyMove(
  state: GameState,
  move: Move,
): { state: GameState; events: GameEvent[] } {
  const piece = pieceAt(state.board, move.from)
  if (!piece || !legalMovesFrom(state, move.from).some((legal) => sameSquare(legal.to, move.to))) {
    throw new Error(
      `Illegal move from row ${move.from.row}, column ${move.from.col} to row ${move.to.row}, column ${move.to.col}.`,
    )
  }

  const attacker = { ...piece, hasMoved: true }
  const defender = pieceAt(state.board, move.to)
  const events: GameEvent[] = []
  let board = withPiece(state.board, move.from, null)
  let captured = state.captured

  if (!defender) {
    board = withPiece(board, move.to, attacker)
    events.push({ type: 'moved', pieceId: attacker.id, from: move.from, to: move.to })
  } else {
    // A fight reveals both pieces, for good.
    const revealedAttacker = { ...attacker, revealed: true }
    const revealedDefender = { ...defender, revealed: true }
    const result = resolveCombat(attacker.rank, defender.rank)
    if (result === 'attacker-wins') {
      board = withPiece(board, move.to, revealedAttacker)
      captured = [...captured, revealedDefender]
    } else if (result === 'defender-wins') {
      board = withPiece(board, move.to, revealedDefender)
      captured = [...captured, revealedAttacker]
    } else {
      board = withPiece(board, move.to, null)
      captured = [...captured, revealedAttacker, revealedDefender]
    }
    events.push({
      type: 'combat',
      from: move.from,
      to: move.to,
      attacker: revealedAttacker,
      defender: revealedDefender,
      result,
    })
  }

  const mover = state.turn
  const next: GameState = {
    ...state,
    board,
    captured,
    history: [...state.history, move],
    turn: mover === 'red' ? 'blue' : 'red',
  }

  const result: GameResult | null =
    defender?.rank === 'flag' ? { winner: mover, reason: 'flag' } : stuckResult(next, mover)
  if (!result) return { state: next, events }

  events.push({ type: 'game-over', result })
  return { state: { ...next, phase: 'over', result }, events }
}

/**
 * If the player now to move has no legal move, they lose. If the player who just moved
 * couldn't move either, neither side can ever move again and it's a draw.
 */
function stuckResult(state: GameState, mover: Player): GameResult | null {
  if (legalMoves(state).length > 0) return null
  const moverCanMove = legalMoves({ ...state, turn: mover }).length > 0
  return moverCanMove ? { winner: mover, reason: 'no-moves' } : { winner: null, reason: 'draw' }
}
