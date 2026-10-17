import type { ReactNode } from 'react'

interface ScreenLayoutProps {
  /** The line above the board: what to do next, or the result. */
  status: ReactNode
  board: ReactNode
  /** The setup tray or the army panel. */
  panel: ReactNode
}

/**
 * The layout of the setup and play screens. On a phone everything stacks: the status line,
 * the board, then the panel. On a wider screen the panel moves beside the board, and the board
 * grows as large as the window's height allows, up to a comfortable maximum.
 */
export default function ScreenLayout({ status, board, panel }: ScreenLayoutProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-center md:gap-6">
      <div className="flex min-w-0 flex-col gap-3 md:w-[min(40rem,calc(100dvh-11rem))]">
        {status}
        {board}
      </div>
      <div className="flex flex-col gap-3 md:w-72 md:shrink-0">{panel}</div>
    </div>
  )
}
