import type { Rank } from '../game/index.ts'
import PieceToken from './PieceToken.tsx'
import { PANEL } from './styles.ts'

interface TrayProps {
  /** Your pieces that aren't on the board yet, in display order. */
  ranks: readonly Rank[]
  /** The rank picked up from the tray, if any. */
  selected: Rank | null
  onSelect: (rank: Rank) => void
}

/** Your unplaced pieces, below the board during setup. Tap one to pick it up. */
export default function Tray({ ranks, selected, onSelect }: TrayProps) {
  // Two Scouts look the same, so only the first one of a picked-up rank is marked.
  const selectedIndex = selected ? ranks.indexOf(selected) : -1

  return (
    <div className={`${PANEL} grid min-h-12 grid-cols-8 gap-1 p-1 md:grid-cols-4 md:gap-2 md:p-2`}>
      {ranks.map((rank, i) => (
        <button
          key={`${rank}-${i}`}
          type="button"
          onClick={() => onSelect(rank)}
          className={`@container flex aspect-square items-center justify-center rounded-md ${i === selectedIndex ? 'ring-3 ring-select' : ''}`}
        >
          <PieceToken piece={{ owner: 'red', rank, hasMoved: false }} />
        </button>
      ))}
      {ranks.length === 0 && (
        <p className="col-span-full self-center text-center text-sm text-slate-500">
          All your pieces are on the board.
        </p>
      )}
    </div>
  )
}
