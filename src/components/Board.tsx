import { isLake, sameSquare, type PlayerView, type Square } from '../game/index.ts'
import PieceToken from './PieceToken.tsx'

/** A background tint for a square: your setup rows, or the squares of the last move. */
export type SquareTint = 'zone' | 'last-move'

const TINT_CLASSES: Readonly<Record<SquareTint, string>> = {
  zone: 'bg-zone',
  'last-move': 'bg-last-move',
}

interface BoardProps {
  /** The pieces to show, with your side at the bottom (row 9). */
  board: PlayerView['board']
  tint?: (square: Square) => SquareTint | undefined
  /** The square whose piece is picked up, if any. */
  selected?: Square | null
  /** Where the picked-up piece can go: a dot on an empty square, a ring on an enemy to attack. */
  targets?: readonly Square[]
  /** Called when a land square is tapped. Without it, the board is for display only. */
  onSquareClick?: (square: Square) => void
}

/** The 10×10 board. It fills the width it's given, and each lake is drawn as one 2×2 pool. */
export default function Board({ board, tint, selected, targets, onSquareClick }: BoardProps) {
  return (
    <div className="grid aspect-square w-full touch-manipulation grid-cols-10 grid-rows-10 gap-px overflow-hidden rounded-lg border border-grid bg-grid">
      {board.flatMap((cells, row) =>
        cells.map((piece, col) => {
          const square = { row, col }
          if (isLake(square)) {
            // Draw each lake once, from its top-left square.
            const isTopLeft = !isLake({ row: row - 1, col }) && !isLake({ row, col: col - 1 })
            return isTopLeft ? (
              <div
                key={`${row}-${col}`}
                className="bg-water"
                style={{ gridRow: `${row + 1} / span 2`, gridColumn: `${col + 1} / span 2` }}
              />
            ) : null
          }
          const squareTint = tint?.(square)
          const background = squareTint ? TINT_CLASSES[squareTint] : 'bg-square'
          const isSelected = !!selected && sameSquare(selected, square)
          const isTarget = !!targets?.some((target) => sameSquare(target, square))
          const ring = isSelected || (isTarget && piece) ? 'ring-3 ring-select ring-inset' : ''
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              disabled={!onSquareClick}
              onClick={() => onSquareClick?.(square)}
              aria-label={piece ? undefined : `Empty square, row ${row + 1}, column ${col + 1}`}
              className={`@container flex items-center justify-center ${background} ${ring}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            >
              {piece && <PieceToken piece={piece} />}
              {isTarget && !piece && <span className="size-[30cqw] rounded-full bg-select/80" />}
            </button>
          )
        }),
      )}
    </div>
  )
}
