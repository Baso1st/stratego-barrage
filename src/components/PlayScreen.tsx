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
import ScreenLayout from './ScreenLayout.tsx'
import { PANEL, PRIMARY_BUTTON } from './styles.ts'

interface PlayScreenProps {
  game: GameState
  /** What the last move did. */
  events: readonly GameEvent[]
  onMove: (move: Move) => void
  onNewGame: () => void
}

/** Who won, and why. */
function resultText({ winner, reason }: GameResult): { title: string; detail: string } {
  if (!winner) return { title: 'Draw.', detail: 'Neither side can move.' }
  if (winner === 'red') {
    return {
      title: 'You win!',
      detail: reason === 'flag' ? 'You captured the enemy Flag.' : "The computer can't move.",
    }
  }
  return {
    title: 'You lose.',
    detail: reason === 'flag' ? 'The computer captured your Flag.' : "You can't move.",
  }
}

/**
 * Play: tap one of your pieces to see where it can go, then tap where to move it. The last
 * move slides in and stays tinted, a fight pops up for a moment, and the panel shows what's
 * left. When the game ends, the result and New game take the place of the status line.
 */
export default function PlayScreen({ game, events, onMove, onNewGame }: PlayScreenProps) {
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

  const result = game.result && resultText(game.result)
  const status = result ? (
    <div className={`${PANEL} flex items-center gap-3 p-3`}>
      <div className="flex-1">
        <p className="font-semibold">{result.title}</p>
        <p className="text-sm text-slate-600">{result.detail}</p>
      </div>
      <button type="button" className={PRIMARY_BUTTON} onClick={onNewGame}>
        New game
      </button>
    </div>
  ) : (
    <p className="min-h-5 text-center text-sm font-medium">
      {yourTurn ? 'Your move.' : 'The computer is thinking…'}
    </p>
  )

  return (
    <ScreenLayout
      status={status}
      board={
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
            slide={lastMove}
            fight={combat}
          />
          {combat && <CombatPopup key={game.history.length} event={combat} />}
        </div>
      }
      panel={<ArmyPanel captured={game.captured} />}
    />
  )
}
