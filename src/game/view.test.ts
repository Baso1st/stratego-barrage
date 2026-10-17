import { describe, expect, it } from 'vitest'
import { blue, position, red } from '../test/positions.ts'
import { pieceAt, viewFor } from './index.ts'

const state = position([
  red('general', 7, 4),
  blue('marshal', 2, 4),
  blue('scout', 2, 5, { revealed: true }),
  blue('miner', 3, 0, { hasMoved: true }),
])
const rankAt = (view: ReturnType<typeof viewFor>, row: number, col: number) => pieceAt(view.board, { row, col })?.rank

describe('viewFor', () => {
  it("hides the ranks of the opponent's pieces that haven't been revealed", () => {
    const view = viewFor(state, 'red')
    expect(view.player).toBe('red')
    expect(rankAt(view, 2, 4)).toBeNull()
    expect(rankAt(view, 3, 0)).toBeNull()
  })

  it('shows your own pieces, revealed enemy pieces, and which enemy pieces have moved', () => {
    const view = viewFor(state, 'red')
    expect(rankAt(view, 7, 4)).toBe('general')
    expect(rankAt(view, 2, 5)).toBe('scout')
    expect(pieceAt(view.board, { row: 3, col: 0 })?.hasMoved).toBe(true)
  })

  it('hides the same way for the other side', () => {
    const view = viewFor(state, 'blue')
    expect(rankAt(view, 7, 4)).toBeNull()
    expect(rankAt(view, 2, 4)).toBe('marshal')
  })

  it('shows everything once the game is over', () => {
    const view = viewFor({ ...state, phase: 'over' }, 'red')
    expect(rankAt(view, 2, 4)).toBe('marshal')
    expect(rankAt(view, 3, 0)).toBe('miner')
  })
})
