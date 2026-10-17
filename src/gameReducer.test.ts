import { describe, expect, it } from 'vitest'
import { createRng, legalMoves, pieceAt, randomSetup } from './game/index.ts'
import { gameReducer, initialState } from './gameReducer.ts'

const rng = createRng(1)
const started = gameReducer(initialState, {
  type: 'start',
  red: randomSetup('red', rng),
  blue: randomSetup('blue', rng),
})

describe('gameReducer', () => {
  it('starts a game with both setups, Red to move', () => {
    expect(started.game?.phase).toBe('playing')
    expect(started.game?.turn).toBe('red')
    expect(started.events).toEqual([])
  })

  it('plays a move and keeps what it did for the UI', () => {
    const game = started.game!
    const move = legalMoves(game).find(({ to }) => !pieceAt(game.board, to))!

    const next = gameReducer(started, { type: 'move', move })

    expect(next.game?.turn).toBe('blue')
    expect(next.events).toEqual([{ type: 'moved', pieceId: pieceAt(game.board, move.from)?.id, ...move }])
  })

  it('goes back to setup for a new game', () => {
    expect(gameReducer(started, { type: 'new-game' })).toBe(initialState)
  })

  it('ignores a move before the game has started', () => {
    expect(gameReducer(initialState, { type: 'move', move: { from: { row: 6, col: 0 }, to: { row: 5, col: 0 } } })).toBe(
      initialState,
    )
  })
})
