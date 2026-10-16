import { Swords } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CombatEvent, Piece } from '../game/index.ts'
import { COMBAT_SHOWN_MS } from '../timing.ts'
import PieceToken from './PieceToken.tsx'
import { RANKS } from './ranks.ts'

const side = (piece: Piece) => (piece.owner === 'red' ? 'your' : 'enemy')
const named = (piece: Piece) => `${RANKS[piece.rank].name} (${RANKS[piece.rank].label})`

/** e.g. "Your General (9) attacks enemy Miner (3): your General wins." */
function describe({ attacker, defender, result }: CombatEvent): string {
  const fight = `${side(attacker)} ${named(attacker)} attacks ${side(defender)} ${named(defender)}`
  const outcome =
    result === 'attacker-wins'
      ? `${side(attacker)} ${RANKS[attacker.rank].name} wins`
      : result === 'defender-wins'
        ? `${side(defender)} ${RANKS[defender.rank].name} wins`
        : 'both are removed'
  return `${fight.charAt(0).toUpperCase()}${fight.slice(1)}: ${outcome}.`
}

/**
 * A fight, shown over the board for a moment: both pieces face-up, the loser faded, and what
 * happened in words. Give it a new `key` for each fight so its timer starts again.
 */
export default function CombatPopup({ event }: { event: CombatEvent }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), COMBAT_SHOWN_MS)
    return () => clearTimeout(timer)
  }, [])
  if (!visible) return null

  const attackerLost = event.result !== 'attacker-wins'
  const defenderLost = event.result !== 'defender-wins'
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-grid"
    >
      <div className="flex items-center justify-center gap-3">
        <div className={`@container size-14 ${attackerLost ? 'opacity-40' : ''}`}>
          <PieceToken piece={event.attacker} />
        </div>
        <Swords aria-hidden className="size-6 text-slate-500" />
        <div className={`@container size-14 ${defenderLost ? 'opacity-40' : ''}`}>
          <PieceToken piece={event.defender} />
        </div>
      </div>
      <p className="mt-2 text-center text-sm font-medium">{describe(event)}</p>
    </div>
  )
}
