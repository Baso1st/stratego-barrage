import { describe, expect, it } from 'vitest'
import { createRng } from './index.ts'
import { shuffle } from './random.ts'

const take = (seed: number, count: number) => {
  const rng = createRng(seed)
  return Array.from({ length: count }, rng)
}

describe('createRng', () => {
  it('gives the same numbers for the same seed, and different ones for another', () => {
    expect(take(42, 10)).toEqual(take(42, 10))
    expect(take(42, 10)).not.toEqual(take(43, 10))
  })

  it('gives numbers from 0 up to, but not including, 1', () => {
    for (const value of take(7, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('shuffle', () => {
  it('returns the same items in a new order, without changing the original', () => {
    const items = Array.from({ length: 20 }, (_, i) => i)
    const shuffled = shuffle(items, createRng(1))
    expect(shuffled).not.toEqual(items)
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items)
    expect(items).toEqual(Array.from({ length: 20 }, (_, i) => i))
  })
})
