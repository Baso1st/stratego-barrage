import { describe, expect, it } from 'vitest'
import { createRng, setupError } from '../game/index.ts'
import { chooseSetup } from './index.ts'

const setups = Array.from({ length: 200 }, (_, seed) => chooseSetup(createRng(seed)))

describe('chooseSetup', () => {
  it("always gives a valid setup in Blue's rows", () => {
    for (const setup of setups) expect(setupError('blue', setup)).toBeNull()
  })

  it('keeps the Flag in the back rows', () => {
    for (const setup of setups) {
      const flag = setup.find((placement) => placement.rank === 'flag')
      expect(flag?.square.row).toBeLessThanOrEqual(1)
    }
  })

  it('varies between 4 layouts and their mirror images', () => {
    expect(new Set(setups.map((setup) => JSON.stringify(setup))).size).toBe(8)
  })
})
