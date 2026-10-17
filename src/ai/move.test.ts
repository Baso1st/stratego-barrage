import { describe, expect, it } from 'vitest'
import {
  applyMove,
  createGame,
  createRng,
  legalMoves,
  placeSetup,
  randomSetup,
  viewFor,
  type GameState,
  type Move,
} from '../game/index.ts'
import { blue, position, randomGame, randomMove, red, type Placed } from '../test/positions.ts'
import { chooseMove, chooseSetup } from './index.ts'

/** The computer's move with Blue to play, worked out from Blue's view only. */
const computerMove = (pieces: readonly Placed[]): Move =>
  chooseMove(viewFor(position(pieces, { turn: 'blue' }), 'blue'), createRng(1))

const square = (row: number, col: number) => ({ row, col })

describe('chooseMove', () => {
  it('attacks a piece it knows is weaker', () => {
    const move = computerMove([
      blue('general', 3, 4),
      blue('bomb', 0, 1),
      blue('flag', 0, 0),
      red('scout', 4, 4, { revealed: true }),
      red('bomb', 9, 1),
      red('flag', 9, 0),
    ])
    expect(move).toEqual({ from: square(3, 4), to: square(4, 4) })
  })

  it('moves a piece away from one it knows is stronger', () => {
    // Blue could move its General instead, but saves its Miner from Red's General.
    const move = computerMove([
      blue('miner', 3, 4),
      blue('general', 0, 9),
      blue('flag', 0, 8),
      blue('bomb', 1, 8),
      red('general', 4, 4, { revealed: true, hasMoved: true }),
      red('flag', 9, 0),
    ])
    expect(move.from).toEqual(square(3, 4))
    expect(move.to).not.toEqual(square(4, 4))
  })

  it('sends its Spy after a Marshal it knows about', () => {
    const move = computerMove([
      blue('spy', 3, 4),
      blue('bomb', 0, 1),
      blue('flag', 0, 0),
      red('marshal', 4, 4, { revealed: true, hasMoved: true }),
      red('flag', 9, 9),
    ])
    expect(move).toEqual({ from: square(3, 4), to: square(4, 4) })
  })

  it('uses a Scout to find out what an unknown piece is', () => {
    // A whole Red army, none of it seen yet, with a clear lane down to one of its pieces.
    const move = computerMove([
      blue('scout', 2, 0),
      blue('bomb', 1, 9),
      blue('flag', 0, 9),
      red('miner', 8, 0),
      red('marshal', 9, 1),
      red('general', 9, 2),
      red('scout', 9, 3),
      red('scout', 9, 4),
      red('spy', 8, 5),
      red('bomb', 9, 8),
      red('flag', 9, 9),
    ])
    expect(move).toEqual({ from: square(2, 0), to: square(8, 0) })
  })

  it('keeps its Marshal away from a piece that might be the Spy', () => {
    const marshalMove = (other: 'spy' | 'scout') =>
      computerMove([
        blue('marshal', 3, 4),
        blue('bomb', 0, 1),
        blue('flag', 0, 0),
        red('scout', 5, 4, { hasMoved: true }),
        red(other, 8, 8, { hasMoved: true }),
        red('flag', 9, 9),
      ])
    // Red's Spy has been captured, so the unseen piece ahead can't be it: the Marshal steps up.
    expect(marshalMove('scout').to).toEqual(square(4, 4))
    // Red's Spy is still out there, and the piece ahead might be it: the Marshal keeps away.
    expect(marshalMove('spy').to).not.toEqual(square(4, 4))
  })

  it('guards its Flag from a Scout with a clear line to it', () => {
    // The piece at the end of Blue's back row might be a Scout, so Blue blocks the row.
    const move = computerMove([
      blue('flag', 0, 5),
      blue('bomb', 1, 5),
      blue('general', 1, 8),
      red('scout', 0, 9, { hasMoved: true }),
      red('spy', 9, 4, { hasMoved: true }),
      red('general', 9, 5, { hasMoved: true }),
      red('flag', 9, 9),
    ])
    expect(move).toEqual({ from: square(1, 8), to: square(0, 8) })
  })

  it("can't see hidden ranks: it plays the same whatever Red's unseen pieces really are", () => {
    const game: GameState = { ...randomGame(createRng(5)), turn: 'blue' }
    // Swap Red's Marshal and General. They move the same way, and Blue hasn't seen either.
    const swapped: GameState = {
      ...game,
      board: game.board.map((cells) =>
        cells.map((piece) => {
          if (piece?.owner !== 'red') return piece
          if (piece.rank === 'marshal') return { ...piece, rank: 'general' }
          if (piece.rank === 'general') return { ...piece, rank: 'marshal' }
          return piece
        }),
      ),
    }
    expect(chooseMove(viewFor(swapped, 'blue'), createRng(1))).toEqual(chooseMove(viewFor(game, 'blue'), createRng(1)))
  })

  it('only ever plays legal moves', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = createRng(seed)
      let state = randomGame(rng)
      for (let i = 0; i < 300 && state.phase === 'playing'; i++) {
        const move = state.turn === 'blue' ? chooseMove(viewFor(state, 'blue'), rng) : randomMove(state, rng)
        expect(legalMoves(state)).toContainEqual(move)
        state = applyMove(state, move).state
      }
    }
  })

  it('beats a player who moves at random almost every time', () => {
    let wins = 0
    for (let seed = 1; seed <= 40; seed++) {
      const rng = createRng(seed)
      let state = placeSetup(placeSetup(createGame(), 'red', randomSetup('red', rng)), 'blue', chooseSetup(rng))
      while (state.phase === 'playing') {
        const move = state.turn === 'blue' ? chooseMove(viewFor(state, 'blue'), rng) : randomMove(state, rng)
        state = applyMove(state, move).state
      }
      if (state.result?.winner === 'blue') wins++
    }
    expect(wins).toBeGreaterThanOrEqual(36)
  })
})
