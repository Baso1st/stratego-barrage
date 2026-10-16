import Board from './components/Board.tsx'
import { sampleView } from './sampleGame.ts'

function App() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-3 p-2">
      <h1 className="text-center text-xl font-semibold">Stratego Barrage</h1>
      <Board view={sampleView} />
    </main>
  )
}

export default App
