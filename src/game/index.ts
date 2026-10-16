// The game engine: Barrage's rules as pure functions over immutable state, with no React.
export { BOARD_SIZE, isLake, isOnBoard, pieceAt, sameSquare } from './board.ts'
export { applyMove } from './game.ts'
export { legalMoves, legalMovesFrom } from './moves.ts'
export { createRng, type Rng } from './random.ts'
export { ARMY, SETUP_ROWS, createGame, placeSetup, randomSetup, setupError } from './setup.ts'
export { viewFor } from './view.ts'
export type * from './types.ts'
