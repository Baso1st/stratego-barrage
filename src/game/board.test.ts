import { describe, expect, it } from 'vitest'
import { BOARD_SIZE, isLake, isOnBoard, pieceAt } from './index.ts'

const allSquares = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => ({
  row: Math.floor(i / BOARD_SIZE),
  col: i % BOARD_SIZE,
}))

describe('the board', () => {
  it('has two 2×2 lakes in the middle rows', () => {
    const lakes = allSquares.filter(isLake).map(({ row, col }) => `${row},${col}`)
    expect(lakes).toEqual(['4,2', '4,3', '4,6', '4,7', '5,2', '5,3', '5,6', '5,7'])
  })

  it('knows which squares are on it', () => {
    expect(isOnBoard({ row: 0, col: 0 })).toBe(true)
    expect(isOnBoard({ row: 9, col: 9 })).toBe(true)
    expect(isOnBoard({ row: -1, col: 0 })).toBe(false)
    expect(isOnBoard({ row: 0, col: 10 })).toBe(false)
  })

  it('finds nothing off the board', () => {
    const board = Array.from({ length: BOARD_SIZE }, () => Array<string | null>(BOARD_SIZE).fill('piece'))
    expect(pieceAt(board, { row: 3, col: 3 })).toBe('piece')
    expect(pieceAt(board, { row: 10, col: 3 })).toBeNull()
  })
})
