import { describe, expect, it } from 'vitest'
import {
  createGame,
  createRng,
  placeSetup,
  randomSetup,
  setupError,
  type Placement,
  type Player,
} from './index.ts'

const validRed = () => randomSetup('red', createRng(1))

describe('setup', () => {
  it('starts with an empty board, waiting for both players', () => {
    const game = createGame()
    expect(game.phase).toBe('setup')
    expect(game.board.flat().every((square) => square === null)).toBe(true)
  })

  it.each(['red', 'blue'] as const)('makes valid random setups for %s', (player: Player) => {
    for (let seed = 0; seed < 50; seed++) {
      const setup = randomSetup(player, createRng(seed))
      expect(setup).toHaveLength(8)
      expect(setupError(player, setup)).toBeNull()
    }
  })

  it('needs exactly the 8 pieces of the army', () => {
    const setup = validRed()
    expect(setupError('red', setup.slice(1))).toMatch('Expected 1 marshal, got 0')

    // A third Scout, on a square that's free.
    const taken = (row: number, col: number) => setup.some(({ square }) => square.row === row && square.col === col)
    const col = [...Array(10).keys()].find((col) => !taken(6, col)) ?? 0
    const extra: Placement = { rank: 'scout', square: { row: 6, col } }
    expect(setupError('red', [...setup, extra])).toMatch('Expected 2 scout, got 3')
  })

  it("needs every piece in the player's own four rows", () => {
    const [first, ...rest] = validRed()
    expect(setupError('red', [{ ...first, square: { row: 5, col: 0 } }, ...rest])).toMatch('outside')
    expect(setupError('blue', validRed())).toMatch('outside')
  })

  it('needs every piece on its own square', () => {
    const [first, second, ...rest] = validRed()
    expect(setupError('red', [first, { ...second, square: first.square }, ...rest])).toMatch('More than one')
  })

  it('puts the pieces on the board, hidden and unmoved, and starts play once both sides are set up', () => {
    const red = validRed()
    const halfway = placeSetup(createGame(), 'red', red)
    expect(halfway.phase).toBe('setup')
    const { rank, square } = red[0]
    expect(halfway.board[square.row][square.col]).toEqual({
      id: `red-${square.row}-${square.col}`,
      owner: 'red',
      rank,
      revealed: false,
      hasMoved: false,
    })

    const started = placeSetup(halfway, 'blue', randomSetup('blue', createRng(2)))
    expect(started.phase).toBe('playing')
    expect(started.turn).toBe('red')
  })

  it('refuses a bad setup, a second setup, or a setup once play has started', () => {
    expect(() => placeSetup(createGame(), 'red', validRed().slice(1))).toThrow()
    const halfway = placeSetup(createGame(), 'red', validRed())
    expect(() => placeSetup(halfway, 'red', validRed())).toThrow('already set up')
    const started = placeSetup(halfway, 'blue', randomSetup('blue', createRng(2)))
    expect(() => placeSetup(started, 'blue', randomSetup('blue', createRng(3)))).toThrow('already started')
  })
})
