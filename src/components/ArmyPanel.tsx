import { ARMY, type Piece, type Player } from '../game/index.ts'
import PieceToken from './PieceToken.tsx'
import { RANK_ORDER } from './ranks.ts'
import { PANEL } from './styles.ts'

/**
 * Both armies, below the board, with captured pieces faded, so you can see what each side
 * has left. Everyone knows what's in an army, so showing the ranks gives nothing away.
 */
export default function ArmyPanel({ captured }: { captured: readonly Piece[] }) {
  return (
    <div className={`${PANEL} flex flex-col gap-2 p-2`}>
      <ArmyRow label="Enemy" owner="blue" captured={captured} />
      <ArmyRow label="You" owner="red" captured={captured} />
    </div>
  )
}

function ArmyRow({ label, owner, captured }: { label: string; owner: Player; captured: readonly Piece[] }) {
  const pieces = RANK_ORDER.flatMap((rank) => {
    const lost = captured.filter((piece) => piece.owner === owner && piece.rank === rank).length
    return Array.from({ length: ARMY[rank] }, (_, i) => ({ rank, lost: i < lost }))
  })
  const left = pieces.filter((piece) => !piece.lost).length

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-slate-600">
        {label}: {left} of {pieces.length} left
      </p>
      <div className="grid grid-cols-8 gap-1 md:grid-cols-4 md:gap-2" aria-hidden>
        {pieces.map(({ rank, lost }, i) => (
          <div
            key={`${rank}-${i}`}
            className={`@container flex aspect-square items-center justify-center ${lost ? 'opacity-25' : ''}`}
          >
            <PieceToken piece={{ owner, rank, hasMoved: false }} />
          </div>
        ))}
      </div>
    </div>
  )
}
