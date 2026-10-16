import { useState } from 'react'
import {
  legalMovesFrom,
  pieceAt,
  sameSquare,
  viewFor,
  type CombatEvent,
  type GameEvent,
  type GameResult,
  type GameState,
  type Move,
  type Square,
} from '../game/index.ts'
import ArmyPanel from './ArmyPanel.tsx'
import Board from './Board.tsx'
import CombatPopup from './CombatPopup.tsx'

interface PlayScreenProps {
  game: GameState
  /** What the last move did. */
  events: readonly GameEvent[]
  onMove: (move: Move) => void
}

function resultText({ winner, reason }: GameResult): string {
  if (!winner) return 'Draw: neither side can move.'
  if (winner === 'red') return reason === 'flag' ? 'You win! You captured the Flag.' : "You win! The computer can't move."
  return reason === 'flag' ? 'You lose. The computer captured your Flag.' : "You lose. You can't move."
}

/**
 * Play: tap one of your pieces to see where it can go, then tap where to move it. The last
 * move is tinted, a fight pops up for a moment, and the panel below shows what's left.
 */
export default function PlayScreen({ game, events, onMove }: PlayScreenProps) {
  const [selected, setSelected] = useState<Square | null>(null)

  const view = viewFor(game, 'red')
  const yourTurn = game.phase === 'playing' && game.turn === 'red'
  const targets = selected ? legalMovesFrom(view, selected).map((move) => move.to) : []
  const lastMove = game.history.at(-1)
  const combat = events.find((event): event is CombatEvent => event.type === 'combat')

  function handleSquareClick(square: Square) {
    if (selected && targets.some((target) => sameSquare(target, square))) {
      onMove({ from: selected, to: square })
      setSelected(null)
      return
    }
    // Pick up a piece that can move; tapping it again, or anywhere else, puts it down.
    const tappedAgain = !!selected && sameSquare(selected, square)
    const canMove = pieceAt(view.board, square)?.owner === 'red' && legalMovesFrom(view, square).length > 0
    setSelected(canMove && !tappedAgain ? square : null)
  }

  return (
    <>
      <div className="min-h-5 text-center text-sm">
        {game.result ? (
          <>
            <p className="font-semibold">{resultText(game.result)}</p>
            <p className="text-slate-600">Reload the page to play again.</p>
          </>
        ) : (
          <p className="font-medium">{yourTurn ? 'Your move.' : 'The computer is thinking…'}</p>
        )}
      </div>
      <div className="relative">
        <Board
          board={view.board}
          tint={(square) =>
            lastMove && (sameSquare(square, lastMove.from) || sameSquare(square, lastMove.to))
              ? 'last-move'
              : undefined
          }
          selected={selected}
          targets={targets}
          onSquareClick={yourTurn ? handleSquareClick : undefined}
        />
        {combat && <CombatPopup key={game.history.length} event={combat} />}
      </div>
      <ArmyPanel captured={game.captured} />
    </>
  )
}
