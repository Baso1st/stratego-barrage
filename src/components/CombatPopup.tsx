import { Swords } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CombatEvent, Piece } from '../game/index.ts'
import { COMBAT_SHOWN_MS, POPUP_FADE_MS } from '../timing.ts'
import { prefersReducedMotion } from './motion.ts'
import PieceToken from './PieceToken.tsx'
import { RANKS } from './ranks.ts'
import { PANEL } from './styles.ts'

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
 * happened in words. It sits at the top or bottom of the board, away from the fight, so you can
 * still see the pieces. Give it a new `key` for each fight so its timer starts again.
 */
export default function CombatPopup({ event }: { event: CombatEvent }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), COMBAT_SHOWN_MS)
    // Fade in, stay, and fade out just before it goes.
    const fade = POPUP_FADE_MS / COMBAT_SHOWN_MS
    const animation = prefersReducedMotion()
      ? undefined
      : ref.current?.animate(
          [
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, offset: fade },
            { opacity: 1, scale: 1, offset: 1 - fade },
            { opacity: 0, scale: 1 },
          ],
          { duration: COMBAT_SHOWN_MS, fill: 'forwards' },
        )
    return () => {
      clearTimeout(timer)
      animation?.cancel()
    }
  }, [])
  if (!visible) return null

  const attackerLost = event.result !== 'attacker-wins'
  const defenderLost = event.result !== 'defender-wins'
  const placement = event.to.row >= 5 ? 'top-3' : 'bottom-3'
  return (
    <div ref={ref} role="status" className={`${PANEL} pointer-events-none absolute inset-x-3 ${placement} p-3`}>
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
