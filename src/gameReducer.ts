// The app's game state, as a reducer around the engine. The engine does the work, so this
// stays thin. Anything random (the computer's choices) is decided before dispatching, which
// keeps the reducer pure.
import {
  applyMove,
  createGame,
  placeSetup,
  type GameEvent,
  type GameState,
  type Move,
  type Placement,
} from './game/index.ts'

export interface AppState {
  /** `null` while you're setting up. */
  readonly game: GameState | null
  /** What the last move did, for the UI to show. */
  readonly events: readonly GameEvent[]
}

export type AppAction =
  | { readonly type: 'start'; readonly red: Placement[]; readonly blue: Placement[] }
  | { readonly type: 'move'; readonly move: Move }

export const initialState: AppState = { game: null, events: [] }

export function gameReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'start': {
      const game = placeSetup(placeSetup(createGame(), 'red', action.red), 'blue', action.blue)
      return { game, events: [] }
    }
    case 'move': {
      if (!state.game) return state
      const { state: game, events } = applyMove(state.game, action.move)
      return { game, events }
    }
  }
}
