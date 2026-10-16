// The game engine: Barrage's rules as pure functions over immutable state, with no React.
export { BOARD_SIZE, isLake, isOnBoard, pieceAt } from './board.ts'
export { legalMoves, legalMovesFrom } from './moves.ts'
export { ARMY, SETUP_ROWS, createGame, placeSetup, setupError } from './setup.ts'
export type * from './types.ts'
