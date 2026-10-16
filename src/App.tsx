import { useState } from 'react'
import { chooseSetup } from './ai/index.ts'
import Board from './components/Board.tsx'
import SetupScreen from './components/SetupScreen.tsx'
import {
  createGame,
  createRng,
  placeSetup,
  viewFor,
  type GameState,
  type Placement,
} from './game/index.ts'

function App() {
  // One random number generator for the session, for Randomize and the computer's choices.
  const [rng] = useState(() => createRng(crypto.getRandomValues(new Uint32Array(1))[0]))
  const [game, setGame] = useState<GameState | null>(null)

  // The computer sets up only once you start, so its layout can't be seen while you place yours.
  function start(placements: Placement[]) {
    const withRed = placeSetup(createGame(), 'red', placements)
    setGame(placeSetup(withRed, 'blue', chooseSetup(rng)))
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 p-2">
      <h1 className="text-center text-xl font-semibold">Stratego Barrage</h1>
      {game ? (
        <Board board={viewFor(game, 'red').board} />
      ) : (
        <SetupScreen rng={rng} onStart={start} />
      )}
    </main>
  )
}

export default App
