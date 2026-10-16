import { useEffect, useReducer, useState } from 'react'
import { chooseMove, chooseSetup } from './ai/index.ts'
import PlayScreen from './components/PlayScreen.tsx'
import SetupScreen from './components/SetupScreen.tsx'
import { createRng, viewFor, type Move, type Placement } from './game/index.ts'
import { gameReducer, initialState } from './gameReducer.ts'
import { COMBAT_SHOWN_MS, THINKING_MS } from './timing.ts'

function App() {
  // One random number generator for the session, for Randomize and the computer's choices.
  const [rng] = useState(() => createRng(crypto.getRandomValues(new Uint32Array(1))[0]))
  const [{ game, events }, dispatch] = useReducer(gameReducer, initialState)

  // The computer's turn: it moves after a short pause, longer if there's a fight to see first.
  useEffect(() => {
    if (game?.phase !== 'playing' || game.turn !== 'blue') return
    const fought = events.some((event) => event.type === 'combat')
    const timer = setTimeout(
      () => dispatch({ type: 'move', move: chooseMove(viewFor(game, 'blue'), rng) }),
      fought ? COMBAT_SHOWN_MS + THINKING_MS : THINKING_MS,
    )
    return () => clearTimeout(timer)
  }, [game, events, rng])

  // The computer sets up only once you start, so its layout can't be seen while you place yours.
  const handleStart = (red: Placement[]) => dispatch({ type: 'start', red, blue: chooseSetup(rng) })
  const handleMove = (move: Move) => dispatch({ type: 'move', move })

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 p-2">
      <h1 className="text-center text-xl font-semibold">Stratego Barrage</h1>
      {game ? (
        <PlayScreen game={game} events={events} onMove={handleMove} />
      ) : (
        <SetupScreen rng={rng} onStart={handleStart} />
      )}
    </main>
  )
}

export default App
