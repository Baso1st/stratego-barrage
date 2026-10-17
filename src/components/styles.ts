// Shared Tailwind class lists, so the flat look is the same everywhere: solid colors, thin
// outlines and rounded corners, with no shadows or gradients.

/** A white card on the page background, like the tray and the army panel. */
export const PANEL = 'rounded-lg bg-white ring-1 ring-grid'

const BUTTON = 'rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-40'
export const SECONDARY_BUTTON = `${BUTTON} bg-white text-slate-900 ring-1 ring-grid`
export const PRIMARY_BUTTON = `${BUTTON} bg-slate-900 text-white`
