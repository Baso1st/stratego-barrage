import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { THINKING_MS } from './timing.ts'

const button = (name: string | RegExp) => screen.getByRole('button', { name })

beforeEach(() => {
  // The computer's thinking pause runs on a timer, so the test moves the clock itself.
  vi.useFakeTimers()
  // The same random numbers every time, so the game always goes the same way.
  vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
    if (array instanceof Uint32Array) array[0] = 1234
    return array
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('App', () => {
  it('sets up, starts, and takes turns with the computer', () => {
    render(<App />)
    fireEvent.click(button('Randomize'))
    fireEvent.click(button('Start'))
    expect(screen.getByText('Your move.')).toBeInTheDocument()

    // Pick up your pieces one by one until one can move, then move it.
    for (const piece of screen.getAllByRole('button', { name: /^Red / })) {
      fireEvent.click(piece)
      const targets = screen.queryAllByRole('button', { name: /^Move here/ })
      if (targets.length > 0) {
        fireEvent.click(targets[0])
        break
      }
    }

    expect(screen.getByText('The computer is thinking…')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(THINKING_MS))
    expect(screen.getByText('Your move.')).toBeInTheDocument()
  })
})
