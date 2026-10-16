import { legalMoves, type Move, type PlayerView, type Rng } from '../game/index.ts'

/** The computer's move: for now, a random legal move, worked out from what it can see. */
export function chooseMove(view: PlayerView, rng: Rng): Move {
  const moves = legalMoves(view)
  return moves[Math.floor(rng() * moves.length)]
}
