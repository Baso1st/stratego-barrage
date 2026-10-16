import { isLake, sameSquare, type PlayerView, type Square } from '../game/index.ts'
import PieceToken from './PieceToken.tsx'

interface BoardProps {
  /** The pieces to show, with your side at the bottom (row 9). */
  board: PlayerView['board']
  /** Squares to tint, like your setup rows. */
  isHighlighted?: (square: Square) => boolean
  /** The square whose piece is picked up, if any. */
  selected?: Square | null
  /** Called when a land square is tapped. Without it, the board is for display only. */
  onSquareClick?: (square: Square) => void
}

/** The 10×10 board. It fills the width it's given, and each lake is drawn as one 2×2 pool. */
export default function Board({ board, isHighlighted, selected, onSquareClick }: BoardProps) {
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
          const tint = isHighlighted?.(square) ? 'bg-zone' : 'bg-square'
          const ring = selected && sameSquare(selected, square) ? 'ring-3 ring-select ring-inset' : ''
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              disabled={!onSquareClick}
              onClick={() => onSquareClick?.(square)}
              aria-label={piece ? undefined : `Empty square, row ${row + 1}, column ${col + 1}`}
              className={`@container flex items-center justify-center ${tint} ${ring}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            >
              {piece && <PieceToken piece={piece} />}
            </button>
          )
        }),
      )}
    </div>
  )
}
