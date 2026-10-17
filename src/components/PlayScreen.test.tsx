import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyMove, type GameEvent, type GameState, type Move } from '../game/index.ts'
import { blue, position, red } from '../test/positions.ts'
import { COMBAT_SHOWN_MS } from '../timing.ts'
import PlayScreen from './PlayScreen.tsx'

// Your General, next to an enemy piece it can attack.
const game = position([red('general', 7, 4), red('flag', 9, 0), blue('miner', 6, 4), blue('flag', 0, 0)])

function renderPlay(state: GameState = game, events: readonly GameEvent[] = []) {
  const onMove = vi.fn<(move: Move) => void>()
  const onNewGame = vi.fn<() => void>()
  render(<PlayScreen game={state} events={events} onMove={onMove} onNewGame={onNewGame} />)
  return { user: userEvent.setup(), onMove, onNewGame }
}

const button = (name: string | RegExp) => screen.getByRole('button', { name })
const moveTargets = () => screen.queryAllByRole('button', { name: /^Move here/ })

afterEach(() => {
  vi.useRealTimers()
})

describe('PlayScreen', () => {
  it('shows where a piece can go when you pick it up, and moves it when you tap one', async () => {
    const { user, onMove } = renderPlay()
    expect(screen.getByText('Your move.')).toBeInTheDocument()
    expect(moveTargets()).toHaveLength(0)

    await user.click(button('Red General'))
    expect(moveTargets()).toHaveLength(3)
    expect(button('Attack Blue piece, row 7, column 5')).toBeInTheDocument()

    await user.click(button('Move here, row 9, column 5'))
    expect(onMove).toHaveBeenCalledWith({ from: { row: 7, col: 4 }, to: { row: 8, col: 4 } })
  })

  it('puts the piece down when you tap it again', async () => {
    const { user, onMove } = renderPlay()
    await user.click(button('Red General'))
    await user.click(button('Red General'))
    expect(moveTargets()).toHaveLength(0)
    expect(onMove).not.toHaveBeenCalled()
  })

  it("doesn't pick up a piece that can't move", async () => {
    const { user } = renderPlay()
    await user.click(button('Red Flag'))
    expect(moveTargets()).toHaveLength(0)
  })

  it("doesn't let you move while the computer is thinking", () => {
    renderPlay({ ...game, turn: 'blue' })
    expect(screen.getByText('The computer is thinking…')).toBeInTheDocument()
    expect(button('Red General')).toBeDisabled()
  })

  it('shows a fight for a moment', () => {
    vi.useFakeTimers()
    const { state, events } = applyMove(game, { from: { row: 7, col: 4 }, to: { row: 6, col: 4 } })
    renderPlay(state, events)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Your General (9) attacks enemy Miner (3): your General wins.',
    )
    act(() => vi.advanceTimersByTime(COMBAT_SHOWN_MS))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows what each side has left', () => {
    renderPlay()
    expect(screen.getByText('Enemy: 2 of 8 left')).toBeInTheDocument()
    expect(screen.getByText('You: 2 of 8 left')).toBeInTheDocument()
  })

  it('shows the result, the whole enemy army and New game when the game is over', async () => {
    const over: GameState = { ...game, phase: 'over', result: { winner: 'red', reason: 'flag' } }
    const { user, onNewGame } = renderPlay(over)

    expect(screen.getByText('You win!')).toBeInTheDocument()
    expect(screen.getByText('You captured the enemy Flag.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Blue Miner' })).toBeInTheDocument()

    await user.click(button('New game'))
    expect(onNewGame).toHaveBeenCalledOnce()
  })
})
