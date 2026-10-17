// Runs before each component test file.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no `matchMedia`. Report that the user prefers reduced motion, so the board and the
// combat pop-up skip their animations, which jsdom can't run either.
window.matchMedia = (query: string) =>
  ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) satisfies MediaQueryList

// Testing Library only cleans up on its own when the test functions are globals, and they aren't.
afterEach(() => cleanup())
