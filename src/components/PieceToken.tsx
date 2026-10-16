import type { PieceView } from '../game/index.ts'
import { RANKS, pieceLabel } from './ranks.ts'

/**
 * One piece, sized to the `@container` around it. Red pieces are rounded squares and Blue
 * pieces are circles, so the sides never depend on color alone. A hidden piece is a plain
 * back, with a dot once it has moved (so it can't be a Bomb or the Flag). Sizes use `cqw`,
 * a percentage of the container's width, so pieces scale with the board.
 */
export default function PieceToken({ piece }: { piece: Pick<PieceView, 'owner' | 'rank' | 'hasMoved'> }) {
  const rank = piece.rank && RANKS[piece.rank]
  const shape = piece.owner === 'red' ? 'rounded-[18cqw] bg-player-red' : 'rounded-full bg-player-blue'

  return (
    <div
      role="img"
      aria-label={pieceLabel(piece.owner, piece.rank, piece.hasMoved)}
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
