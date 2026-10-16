import { execFileSync } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The release tag on a released commit (v0.2.0). Otherwise the last release, the number
// of commits since it, and this commit (v0.2.0-3-gabc1234), plus -dirty for uncommitted changes.
function gitVersion(): string {
  try {
    return execFileSync('git', ['describe', '--tags', '--match', 'v*', '--always', '--dirty'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(gitVersion()),
  },
  test: {
    // No tests yet; the first ones arrive with the game logic.
    passWithNoTests: true,
  },
})
