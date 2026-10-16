import { isLake, type PlayerView } from '../game/index.ts'
import PieceToken from './PieceToken.tsx'

/**
 * The 10×10 board as one player sees it, with their side at the bottom. It fills the width
 * it's given, and each lake is drawn as one 2×2 pool.
 */
export default function Board({ view }: { view: PlayerView }) {
  return (
    <div className="grid aspect-square w-full touch-manipulation grid-cols-10 grid-rows-10 gap-px overflow-hidden rounded-lg border border-grid bg-grid">
      {view.board.flatMap((cells, row) =>
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
          return (
            <div
              key={`${row}-${col}`}
              className="@container flex items-center justify-center bg-square"
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            >
              {piece && <PieceToken piece={piece} />}
            </div>
          )
        }),
      )}
    </div>
  )
}
