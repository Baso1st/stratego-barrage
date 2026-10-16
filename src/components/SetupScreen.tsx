import { useState } from 'react'
import {
  ARMY,
  BOARD_SIZE,
  SETUP_ROWS,
  randomSetup,
  sameSquare,
  type Placement,
  type PlayerView,
  type Rank,
  type Rng,
  type Square,
} from '../game/index.ts'
import Board from './Board.tsx'
import Tray from './Tray.tsx'
import { RANK_ORDER } from './ranks.ts'

/** What's picked up: a piece from the tray, or a piece already on the board. */
type Selection = { from: 'tray'; rank: Rank } | { from: 'board'; square: Square } | null

interface SetupScreenProps {
  rng: Rng
  onStart: (placements: Placement[]) => void
}

const isSetupSquare = (square: Square) => SETUP_ROWS.red.includes(square.row)

const BUTTON = 'rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-40'
const SECONDARY = `${BUTTON} bg-white text-slate-900 ring-1 ring-grid`
const PRIMARY = `${BUTTON} bg-slate-900 text-white`

/**
 * Setup: you place your 8 pieces in your four rows. Tap a piece in the tray, then a square, to
 * place it. Tap a placed piece, then another square, to move it there or swap the two.
 */
export default function SetupScreen({ rng, onStart }: SetupScreenProps) {
  const [placements, setPlacements] = useState<Placement[]>([])
  const [selection, setSelection] = useState<Selection>(null)

  const placementAt = (square: Square) => placements.find((p) => sameSquare(p.square, square))
  const unplaced = RANK_ORDER.flatMap((rank) =>
    Array<Rank>(ARMY[rank] - placements.filter((p) => p.rank === rank).length).fill(rank),
  )
  const ready = unplaced.length === 0

  function handleSquareClick(square: Square) {
    const occupant = placementAt(square)
    if (!isSetupSquare(square)) {
      setSelection(null)
    } else if (selection?.from === 'tray') {
      // Place the picked-up piece. Anything already on the square goes back to the tray.
      setPlacements([...placements.filter((p) => p !== occupant), { rank: selection.rank, square }])
      setSelection(null)
    } else if (selection?.from === 'board') {
      // Move the picked-up piece here, swapping it with whatever is here.
      const from = selection.square
      setPlacements(
        placements.map((p) =>
          sameSquare(p.square, from) ? { ...p, square } : p === occupant ? { ...p, square: from } : p,
        ),
      )
      setSelection(null)
    } else if (occupant) {
      setSelection({ from: 'board', square })
    }
  }

  function handleTraySelect(rank: Rank) {
    const sameRank = selection?.from === 'tray' && selection.rank === rank
    setSelection(sameRank ? null : { from: 'tray', rank })
  }

  const board: PlayerView['board'] = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
      const placement = placementAt({ row, col })
      return placement
        ? { id: `red-${row}-${col}`, owner: 'red', rank: placement.rank, revealed: false, hasMoved: false }
        : null
    }),
  )

  return (
    <>
      <p className="text-center text-sm text-slate-600">
        {ready
          ? 'All set. Tap Start to begin.'
          : `Place your pieces in the tinted rows: ${placements.length} of ${placements.length + unplaced.length} placed.`}
      </p>
      <Board
        board={board}
        isHighlighted={isSetupSquare}
        selected={selection?.from === 'board' ? selection.square : null}
        onSquareClick={handleSquareClick}
      />
      <Tray
        ranks={unplaced}
        selected={selection?.from === 'tray' ? selection.rank : null}
        onSelect={handleTraySelect}
      />
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className={SECONDARY}
          onClick={() => {
            setPlacements(randomSetup('red', rng))
            setSelection(null)
          }}
        >
          Randomize
        </button>
        <button
          type="button"
          className={SECONDARY}
          disabled={placements.length === 0}
          onClick={() => {
            setPlacements([])
            setSelection(null)
          }}
        >
          Clear
        </button>
        <button type="button" className={PRIMARY} disabled={!ready} onClick={() => onStart(placements)}>
          Start
        </button>
      </div>
    </>
  )
}
