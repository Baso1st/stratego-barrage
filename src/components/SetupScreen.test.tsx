import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createRng, setupError, type Placement } from '../game/index.ts'
import SetupScreen from './SetupScreen.tsx'

function renderSetup() {
  const onStart = vi.fn<(placements: Placement[]) => void>()
  render(<SetupScreen rng={createRng(1)} onStart={onStart} />)
  return { user: userEvent.setup(), onStart }
}

const button = (name: string | RegExp) => screen.getByRole('button', { name })

describe('SetupScreen', () => {
  it('places a piece from the tray on a square you tap in your rows', async () => {
    const { user } = renderSetup()
    expect(screen.getByText(/0 of 8 placed/)).toBeInTheDocument()

    await user.click(button('Red Marshal'))
    await user.click(button('Empty square, row 7, column 1'))

    expect(screen.getByText(/1 of 8 placed/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Empty square, row 7, column 1' })).not.toBeInTheDocument()
    // It left the tray, so the only Marshal is the one on the board.
    expect(screen.getAllByRole('button', { name: 'Red Marshal' })).toHaveLength(1)
  })

  it("doesn't place a piece outside your rows", async () => {
    const { user } = renderSetup()
    await user.click(button('Red Marshal'))
    await user.click(button('Empty square, row 5, column 1'))
    expect(screen.getByText(/0 of 8 placed/)).toBeInTheDocument()
  })

  it('moves a placed piece to another square', async () => {
    const { user } = renderSetup()
    await user.click(button('Red Marshal'))
    await user.click(button('Empty square, row 7, column 1'))

    await user.click(button('Red Marshal'))
    await user.click(button('Empty square, row 8, column 1'))

    expect(button('Empty square, row 7, column 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Empty square, row 8, column 1' })).not.toBeInTheDocument()
  })

  it('fills your rows with Randomize, and hands over the setup with Start', async () => {
    const { user, onStart } = renderSetup()
    expect(button('Start')).toBeDisabled()

    await user.click(button('Randomize'))
    expect(screen.getByText('All set. Tap Start to begin.')).toBeInTheDocument()
    await user.click(button('Start'))

    expect(onStart).toHaveBeenCalledOnce()
    expect(setupError('red', onStart.mock.calls[0][0])).toBeNull()
  })

  it('empties the board with Clear', async () => {
    const { user } = renderSetup()
    await user.click(button('Randomize'))
    await user.click(button('Clear'))
    expect(screen.getByText(/0 of 8 placed/)).toBeInTheDocument()
    expect(button('Start')).toBeDisabled()
    expect(button('Clear')).toBeDisabled()
  })
})
