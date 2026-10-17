import { describe, expect, it } from 'vitest'
import { blue, playRandomly, position, randomGame, red } from '../test/positions.ts'
import { applyMove, createRng, pieceAt } from './index.ts'

const square = (row: number, col: number) => ({ row, col })

describe('applyMove', () => {
  it('moves a piece to an empty square, marks it as moved and passes the turn', () => {
    const state = position([red('general', 7, 4), red('flag', 9, 0), blue('general', 2, 4), blue('flag', 0, 0)])
    const move = { from: square(7, 4), to: square(6, 4) }

    const { state: next, events } = applyMove(state, move)

    expect(pieceAt(next.board, square(6, 4))).toEqual({
      id: 'red-7-4',
      owner: 'red',
      rank: 'general',
      revealed: false,
      hasMoved: true,
    })
    expect(pieceAt(next.board, square(7, 4))).toBeNull()
    expect(next.turn).toBe('blue')
    expect(next.history).toEqual([move])
    expect(events).toEqual([{ type: 'moved', pieceId: 'red-7-4', ...move }])
    // The state it was given is left as it was.
    expect(pieceAt(state.board, square(7, 4))?.rank).toBe('general')
  })

  it('throws on an illegal move', () => {
    const state = position([red('general', 7, 4), red('miner', 7, 5), blue('general', 2, 4), blue('flag', 0, 0)])
    expect(() => applyMove(state, { from: square(7, 4), to: square(6, 5) })).toThrow('Illegal move')
    expect(() => applyMove(state, { from: square(7, 4), to: square(7, 5) })).toThrow('Illegal move')
    expect(() => applyMove(state, { from: square(2, 4), to: square(3, 4) })).toThrow('Illegal move')
  })

  it('reveals both pieces in a fight and takes the loser off the board', () => {
    const state = position([red('general', 5, 4), red('flag', 9, 0), blue('miner', 4, 4), blue('scout', 0, 9), blue('flag', 0, 0)])

    const { state: next, events } = applyMove(state, { from: square(5, 4), to: square(4, 4) })

    expect(pieceAt(next.board, square(4, 4))).toMatchObject({ owner: 'red', rank: 'general', revealed: true })
    expect(next.captured.slice(state.captured.length)).toEqual([
      { id: 'blue-4-4', owner: 'blue', rank: 'miner', revealed: true, hasMoved: false },
    ])
    expect(events).toEqual([
      expect.objectContaining({
        type: 'combat',
        attacker: expect.objectContaining({ rank: 'general' }),
        defender: expect.objectContaining({ rank: 'miner' }),
        result: 'attacker-wins',
      }),
    ])
  })

  it('leaves the defender in place when it wins', () => {
    const state = position([red('scout', 5, 4), red('flag', 9, 0), blue('general', 4, 4), blue('flag', 0, 0)])
    const { state: next } = applyMove(state, { from: square(5, 4), to: square(4, 4) })
    expect(pieceAt(next.board, square(4, 4))).toMatchObject({ owner: 'blue', rank: 'general', revealed: true })
    expect(pieceAt(next.board, square(5, 4))).toBeNull()
    expect(next.captured.at(-1)).toMatchObject({ owner: 'red', rank: 'scout' })
  })

  it('takes both pieces off the board when they are the same rank', () => {
    const state = position([red('miner', 5, 4), red('scout', 9, 5), blue('miner', 4, 4), blue('scout', 0, 9), blue('flag', 0, 0)])
    const { state: next } = applyMove(state, { from: square(5, 4), to: square(4, 4) })
    expect(pieceAt(next.board, square(4, 4))).toBeNull()
    expect(next.captured.slice(-2).map((piece) => piece.owner)).toEqual(['red', 'blue'])
  })

  it('ends the game when the Flag is captured', () => {
    const state = position([red('scout', 5, 0), red('flag', 9, 0), blue('flag', 1, 0), blue('general', 0, 9)])
    const { state: next, events } = applyMove(state, { from: square(5, 0), to: square(1, 0) })
    expect(next.phase).toBe('over')
    expect(next.result).toEqual({ winner: 'red', reason: 'flag' })
    expect(events.at(-1)).toEqual({ type: 'game-over', result: { winner: 'red', reason: 'flag' } })
  })

  it('ends the game when the player to move has no piece that can move', () => {
    // Blue's last piece that can move is captured, leaving only its Bomb and Flag.
    const state = position([red('general', 5, 4), red('flag', 9, 0), blue('miner', 4, 4), blue('bomb', 0, 1), blue('flag', 0, 0)])
    const { state: next } = applyMove(state, { from: square(5, 4), to: square(4, 4) })
    expect(next.result).toEqual({ winner: 'red', reason: 'no-moves' })
  })

  it('is a draw when neither side can move', () => {
    // The last two pieces that can move take each other out.
    const state = position([red('general', 5, 4), red('flag', 9, 0), blue('general', 4, 4), blue('bomb', 0, 1), blue('flag', 0, 0)])
    const { state: next } = applyMove(state, { from: square(5, 4), to: square(4, 4) })
    expect(next.result).toEqual({ winner: null, reason: 'draw' })
  })

  it('always gets to the end of a game played at random', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = createRng(seed)
      const end = playRandomly(randomGame(rng), rng, 5000)
      expect(end.phase).toBe('over')
      // Pieces are never lost: every one is on the board or captured.
      const onBoard = end.board.flat().filter((piece) => piece).length
      expect(onBoard + end.captured.length).toBe(16)
    }
  })
})
