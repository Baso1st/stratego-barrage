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
import type { PieceView, Rank } from '../game/index.ts'

const RANKS: Readonly<Record<Rank, { label: string; name: string; Icon: LucideIcon }>> = {
  marshal: { label: '10', name: 'Marshal', Icon: Crown },
  general: { label: '9', name: 'General', Icon: Star },
  miner: { label: '3', name: 'Miner', Icon: Pickaxe },
  scout: { label: '2', name: 'Scout', Icon: Binoculars },
  spy: { label: 'S', name: 'Spy', Icon: VenetianMask },
  bomb: { label: 'B', name: 'Bomb', Icon: Bomb },
  flag: { label: 'F', name: 'Flag', Icon: Flag },
}

/**
 * One piece, sized to its square. Red pieces are rounded squares and Blue pieces are circles,
 * so the sides never depend on color alone. A hidden piece is a plain back, with a dot once
 * it has moved (so it can't be a Bomb or the Flag). Sizes use `cqw`, a percentage of the
 * square's width, so pieces scale with the board.
 */
export default function PieceToken({ piece }: { piece: PieceView }) {
  const rank = piece.rank && RANKS[piece.rank]
  const side = piece.owner === 'red' ? 'Red' : 'Blue'
  const label = rank
    ? `${side} ${rank.name}`
    : `${side} piece${piece.hasMoved ? ' that has moved' : ''}`
  const shape = piece.owner === 'red' ? 'rounded-[18cqw] bg-player-red' : 'rounded-full bg-player-blue'

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative flex size-[86cqw] flex-col items-center justify-center text-white ${shape}`}
    >
      {rank && (
        <>
          <rank.Icon aria-hidden className="size-[36cqw]" strokeWidth={2.5} />
          <span className="text-[30cqw] leading-none font-bold">{rank.label}</span>
        </>
      )}
      {!rank && piece.hasMoved && (
        <span className="absolute top-[16cqw] right-[16cqw] size-[16cqw] rounded-full bg-white/85" />
      )}
    </div>
  )
}
