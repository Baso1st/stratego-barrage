import {
  Binoculars,
  Bomb,
  Crown,
  Flag,
  Pickaxe,
  Star,
  VenetianMask,
  type LucideIcon,
} from 'lucide-react'
import type { Player, Rank } from '../game/index.ts'

/** How each rank is shown: its short label, its name and its icon. */
export const RANKS: Readonly<Record<Rank, { label: string; name: string; Icon: LucideIcon }>> = {
  marshal: { label: '10', name: 'Marshal', Icon: Crown },
  general: { label: '9', name: 'General', Icon: Star },
  miner: { label: '3', name: 'Miner', Icon: Pickaxe },
  scout: { label: '2', name: 'Scout', Icon: Binoculars },
  spy: { label: 'S', name: 'Spy', Icon: VenetianMask },
  bomb: { label: 'B', name: 'Bomb', Icon: Bomb },
  flag: { label: 'F', name: 'Flag', Icon: Flag },
}

/** The order pieces are listed in, strongest first. */
export const RANK_ORDER: readonly Rank[] = [
  'marshal',
  'general',
  'miner',
  'scout',
  'spy',
  'bomb',
  'flag',
]

/** A spoken description of a piece, e.g. "Red Marshal" or "Blue piece that has moved". */
export function pieceLabel(owner: Player, rank: Rank | null, hasMoved: boolean): string {
  const side = owner === 'red' ? 'Red' : 'Blue'
  if (rank) return `${side} ${RANKS[rank].name}`
  return `${side} piece${hasMoved ? ' that has moved' : ''}`
}
