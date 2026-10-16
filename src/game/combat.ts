import type { CombatResult, Rank } from './types.ts'

// Fighting strength. Bombs and the Flag never attack, and attacks on them follow their own rules.
const STRENGTH: Readonly<Record<Rank, number>> = {
  marshal: 10,
  general: 9,
  miner: 3,
  scout: 2,
  spy: 1,
  bomb: 0,
  flag: 0,
}

/**
 * Who wins when `attacker` attacks `defender`. The higher rank wins and equal ranks both lose,
 * with three exceptions: the Spy beats the Marshal when the Spy attacks, only a Miner survives
 * attacking a Bomb, and anything that attacks the Flag captures it.
 */
export function resolveCombat(attacker: Rank, defender: Rank): CombatResult {
  if (defender === 'flag') return 'attacker-wins'
  if (defender === 'bomb') return attacker === 'miner' ? 'attacker-wins' : 'defender-wins'
  if (attacker === 'spy' && defender === 'marshal') return 'attacker-wins'
  if (STRENGTH[attacker] === STRENGTH[defender]) return 'both-lose'
  return STRENGTH[attacker] > STRENGTH[defender] ? 'attacker-wins' : 'defender-wins'
}
