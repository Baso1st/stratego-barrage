import { describe, expect, it } from 'vitest'
import { resolveCombat, type Rank } from './index.ts'

const MOVABLE: readonly Rank[] = ['marshal', 'general', 'miner', 'scout', 'spy']

describe('resolveCombat', () => {
  it.each([
    ['marshal', 'general'],
    ['general', 'miner'],
    ['miner', 'scout'],
    ['scout', 'spy'],
  ] as const)('lets the higher rank win: %s beats %s', (higher, lower) => {
    expect(resolveCombat(higher, lower)).toBe('attacker-wins')
    expect(resolveCombat(lower, higher)).toBe('defender-wins')
  })

  it.each(MOVABLE)('removes both pieces when a %s fights its own rank', (rank) => {
    expect(resolveCombat(rank, rank)).toBe('both-lose')
  })

  it('lets the Spy beat the Marshal, but only when the Spy attacks', () => {
    expect(resolveCombat('spy', 'marshal')).toBe('attacker-wins')
    expect(resolveCombat('marshal', 'spy')).toBe('attacker-wins')
  })

  it.each(['general', 'miner', 'scout'] as const)('makes the Spy lose to a %s either way', (rank) => {
    expect(resolveCombat('spy', rank)).toBe('defender-wins')
    expect(resolveCombat(rank, 'spy')).toBe('attacker-wins')
  })

  it('lets only a Miner survive attacking a Bomb', () => {
    expect(resolveCombat('miner', 'bomb')).toBe('attacker-wins')
    for (const rank of MOVABLE.filter((rank) => rank !== 'miner')) {
      expect(resolveCombat(rank, 'bomb')).toBe('defender-wins')
    }
  })

  it.each(MOVABLE)('lets a %s capture the Flag', (rank) => {
    expect(resolveCombat(rank, 'flag')).toBe('attacker-wins')
  })
})
