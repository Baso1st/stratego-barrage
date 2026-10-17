import { describe, expect, it } from 'vitest'
import { blue, playRandomly, position, randomGame, red } from '../test/positions.ts'
import { applyMove, createRng, legalMoves, legalMovesFrom, viewFor, type GameState, type Move } from './index.ts'

/** Where a list of moves goes, as sorted "row,col" strings, to compare regardless of order. */
const destinations = (moves: readonly Move[]) => moves.map(({ to }) => `${to.row},${to.col}`).sort()

describe('legal moves', () => {
  it('step one square up, down, left or right', () => {
    const state = position([red('general', 7, 4), blue('flag', 0, 0)])
    expect(destinations(legalMovesFrom(state, { row: 7, col: 4 }))).toEqual(['6,4', '7,3', '7,5', '8,4'])
  })

  it('never go into a lake or off the board', () => {
    const state = position([red('general', 6, 2), red('miner', 9, 0), blue('flag', 0, 0)])
    expect(destinations(legalMovesFrom(state, { row: 6, col: 2 }))).toEqual(['6,1', '6,3', '7,2'])
    expect(destinations(legalMovesFrom(state, { row: 9, col: 0 }))).toEqual(['8,0', '9,1'])
  })

  it('never land on your own piece, but can attack an enemy one', () => {
    const state = position([red('general', 7, 4), red('miner', 7, 5), blue('scout', 6, 4), blue('flag', 0, 0)])
    expect(destinations(legalMovesFrom(state, { row: 7, col: 4 }))).toEqual(['6,4', '7,3', '8,4'])
  })

  it('never move a Bomb or the Flag', () => {
    const state = position([red('bomb', 8, 8), red('flag', 9, 9), blue('flag', 0, 0)])
    expect(legalMoves(state)).toEqual([])
  })

  it('let a Scout slide any number of empty squares in a straight line', () => {
    const state = position([red('scout', 9, 0), blue('flag', 0, 9)])
    expect(legalMovesFrom(state, { row: 9, col: 0 })).toHaveLength(18)
  })

  it('stop a Scout at the first piece in its way, attacking it if it is an enemy', () => {
    const state = position([red('scout', 9, 0), red('bomb', 9, 3), blue('miner', 5, 0), blue('flag', 0, 9)])
    expect(destinations(legalMovesFrom(state, { row: 9, col: 0 }))).toEqual([
      '5,0',
      '6,0',
      '7,0',
      '8,0',
      '9,1',
      '9,2',
    ])
  })

  it("don't let a Scout cross a lake", () => {
    const state = position([red('scout', 6, 2), blue('flag', 0, 0)])
    const rows = legalMovesFrom(state, { row: 6, col: 2 }).map(({ to }) => to.row)
    expect(Math.min(...rows)).toBe(6)
  })

  it('only exist for the side to move, while the game is being played', () => {
    const pieces = [red('general', 7, 4), blue('general', 2, 4)]
    expect(legalMovesFrom(position(pieces, { turn: 'blue' }), { row: 7, col: 4 })).toEqual([])
    expect(legalMoves(position(pieces, { phase: 'over' }))).toEqual([])
  })

  it("don't let a piece go back and forth between two squares more than 3 times in a row", () => {
    let state: GameState = position([
      red('general', 7, 0),
      red('flag', 9, 9),
      blue('general', 2, 9),
      blue('flag', 0, 0),
    ])
    const play = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      state = applyMove(state, { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } }).state
    }
    // Red's General goes back and forth 3 times, while Blue's walks along its row.
    play(7, 0, 6, 0)
    play(2, 9, 2, 8)
    play(6, 0, 7, 0)
    play(2, 8, 2, 7)
    play(7, 0, 6, 0)
    play(2, 7, 2, 6)

    // A 4th time isn't allowed, but other moves are.
    expect(destinations(legalMovesFrom(state, { row: 6, col: 0 }))).toEqual(['5,0', '6,1'])

    // Once it has moved somewhere else, it can go back again.
    play(6, 0, 6, 1)
    play(2, 6, 2, 5)
    expect(destinations(legalMovesFrom(state, { row: 6, col: 1 }))).toContain('6,0')
  })

  it("are the same whether worked out from the full game or from the mover's own view", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = createRng(seed)
      playRandomly(randomGame(rng), rng, 200, (state) => {
        expect(legalMoves(viewFor(state, state.turn))).toEqual(legalMoves(state))
      })
    }
  })
})
