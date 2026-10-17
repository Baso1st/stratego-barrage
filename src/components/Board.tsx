import { useLayoutEffect, useRef, type Ref } from 'react'
import {
  isLake,
  sameSquare,
  type CombatEvent,
  type Move,
  type Piece,
  type PieceView,
  type PlayerView,
  type Square,
} from '../game/index.ts'
import { FADE_MS, SLIDE_MS } from '../timing.ts'
import { prefersReducedMotion } from './motion.ts'
import PieceToken from './PieceToken.tsx'
import { pieceLabel } from './ranks.ts'

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
  /** A move to animate: the piece that made it slides from its old square to its new one. */
  slide?: Move
  /** The fight that move started, if any. Whoever lost it fades out once the attacker arrives. */
  fight?: CombatEvent
}

/** The 10×10 board. It fills the width it's given, and each lake is drawn as one 2×2 pool. */
export default function Board({ board, tint, selected, targets, onSquareClick, slide, fight }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const attackerRef = useRef<HTMLDivElement>(null)
  const defenderRef = useRef<HTMLDivElement>(null)
  // Pieces that lose a fight are already gone from `board`, so they're drawn again on top of it
  // ("ghosts") just long enough to fade out.
  const attackerLost = !!fight && fight.result !== 'attacker-wins'
  const defenderLost = !!fight && fight.result !== 'defender-wins'

  // Slide the moved piece in: measure how far apart the two squares are, start the piece back
  // on its old square, and let it travel to its new one. Then fade out whoever lost.
  useLayoutEffect(() => {
    const element = boardRef.current
    if (!slide || !element || prefersReducedMotion()) return
    const squareAt = ({ row, col }: Square) => element.querySelector(`[data-square="${row}-${col}"]`)
    const from = squareAt(slide.from)
    const to = squareAt(slide.to)
    if (!from || !to) return
    const x = to.getBoundingClientRect().left - from.getBoundingClientRect().left
    const y = to.getBoundingClientRect().top - from.getBoundingClientRect().top
    const arrived = `${x}px ${y}px`
    // When the attacker reaches the square it attacked, as a share of the whole animation.
    const arrival = SLIDE_MS / (SLIDE_MS + FADE_MS)
    const timing = { duration: SLIDE_MS + FADE_MS }

    const animations = [
      attackerLost
        ? attackerRef.current?.animate(
            [
              { translate: '0 0', opacity: 1, scale: 1, easing: 'ease-out' },
              { translate: arrived, opacity: 1, scale: 1, offset: arrival },
              { translate: arrived, opacity: 0, scale: 0.6 },
            ],
            timing,
          )
        : to.firstElementChild?.animate(
            [
              { translate: `${-x}px ${-y}px`, zIndex: 1 },
              { translate: '0 0', zIndex: 1 },
            ],
            { duration: SLIDE_MS, easing: 'ease-out' },
          ),
      defenderLost
        ? defenderRef.current?.animate(
            [
              { opacity: 1, scale: 1 },
              { opacity: 1, scale: 1, offset: arrival },
              { opacity: 0, scale: 0.6 },
            ],
            timing,
          )
        : undefined,
    ]
    return () => animations.forEach((animation) => animation?.cancel())
  }, [slide, attackerLost, defenderLost])

  return (
    <div
      ref={boardRef}
      className="grid aspect-square w-full touch-manipulation grid-cols-10 grid-rows-10 gap-px overflow-hidden rounded-lg border border-grid bg-grid"
    >
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
              aria-label={squareLabel(piece, isTarget, row, col)}
              data-square={`${row}-${col}`}
              className={`@container flex items-center justify-center ${background} ${ring}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            >
              {piece && <PieceToken piece={piece} />}
              {isTarget && !piece && <span className="size-[30cqw] rounded-full bg-select/80" />}
            </button>
          )
        }),
      )}
      {fight && defenderLost && <Ghost ref={defenderRef} piece={fight.defender} square={fight.to} />}
      {fight && attackerLost && <Ghost ref={attackerRef} piece={fight.attacker} square={fight.from} />}
    </div>
  )
}

/**
 * What a square is called for screen readers. A piece names itself, unless it can be attacked;
 * an empty square says where it is, and whether the picked-up piece can move there.
 */
function squareLabel(piece: PieceView | null, isTarget: boolean, row: number, col: number): string | undefined {
  const where = `row ${row + 1}, column ${col + 1}`
  if (piece) return isTarget ? `Attack ${pieceLabel(piece.owner, piece.rank, piece.hasMoved)}, ${where}` : undefined
  return isTarget ? `Move here, ${where}` : `Empty square, ${where}`
}

interface GhostProps {
  ref: Ref<HTMLDivElement>
  piece: Piece
  square: Square
}

/** A piece that lost its fight, drawn over the board. It's invisible except while it fades out. */
function Ghost({ ref, piece, square }: GhostProps) {
  return (
    <div
      ref={ref}
      aria-hidden
      className="@container pointer-events-none relative z-2 flex items-center justify-center opacity-0"
      style={{ gridRow: square.row + 1, gridColumn: square.col + 1 }}
    >
      <PieceToken piece={piece} />
    </div>
  )
}
