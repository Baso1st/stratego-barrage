# Roadmap

The living record of where the project stands, and the only place progress is tracked. Update it whenever a task is finished, a decision is made, or the plan changes.

## Current status

**Working on:** Play (not started yet).

- **Project setup is complete.**
  - The app is React + TypeScript on Vite, with Vitest installed but no tests yet.
  - CI lints, tests and builds every PR, and `main` is protected by a ruleset.
  - Every merge to `main` deploys to test (https://ambitious-sky-0c8060710.3.azurestaticapps.net/). `v0.2.0` is released to production (https://lively-desert-0006fa410.6.azurestaticapps.net/).
  - Both sites show their version, and Dependabot keeps dependencies up to date.
- **The game engine is built,** in `src/game/`, with all the rules.
- **The board is on screen,** styled with Tailwind and laid out for a phone.
- **The setup phase works.** You place your pieces with the tray, Randomize, Clear and Start. When you press Start, the computer (`src/ai/`) sets up from one of its hand-made layouts. After that the board shows both armies, but nothing can move yet.
- All of this is on the `engine-basics` branch, which isn't merged yet.
- **How the game should work** (rules, system design and UI) is in [GAME_DESIGN.md](GAME_DESIGN.md).

## Roadmap

We build these in order, one at a time, and finish each before starting the next.

- [x] **Project setup:** Vite, React and TypeScript, Vitest, CI, a protected `main`, test and production on Azure, and the template demo removed.
- [x] **Game engine:** the rules as pure TypeScript in `src/game/`. Setup, legal moves (Scouts, lakes and the back-and-forth limit), combat, win, loss and draw, and each player's view of the board. Nothing on screen.
- [x] **Board on screen:** add Tailwind, and draw the 10×10 board, the lakes and the pieces from a sample game, in the phone layout.
- [x] **Setup phase:** you place your 8 pieces in your four rows (with Randomize, Clear and Start), and the computer places its own.
- [ ] **Play:** tap to select and move, see fights, and take turns against a computer that makes random legal moves. This is the first playable release.
- [ ] **Computer opponent:** replace the random moves with the rules of thumb.
- [ ] **Polish:** animations, the game-over screen with New game, the desktop layout, and the flat style throughout.
- [ ] **Tests:** unit tests for the engine and the computer opponent, and component tests for the UI.

## Decisions

Game design decisions (rules, computer opponent, UI) are recorded in [GAME_DESIGN.md](GAME_DESIGN.md#decisions). Project decisions are here:

- Single player against the computer.
- Front end only, no back end.
- Built with React and TypeScript, using Vite.
- The user does all `git add` / `git commit` manually.
- Trunk-based development: `main` is the trunk and should always build and pass tests.
- Tests are written once the game is built: they're the last roadmap item.
- Hosted on Azure Static Web Apps, with two environments:
  - **Test:** every merge to `main` deploys here automatically.
  - **Production:** publishing a GitHub Release with a `v*` tag (e.g. `v0.1.0`) on a `main` commit deploys that commit here, after the user approves the deployment in GitHub (required reviewer on the `production` environment).
- Infrastructure as code in Bicep (`infra/`). The CD pipeline applies `infra/main.bicep` on every deployment, so infra changes are promoted from test to production like app changes. A one-time bootstrap, run by hand, creates the resource groups and the identities GitHub Actions signs in as.
- GitHub Actions signs in to Azure with OIDC: one managed identity per environment, each Contributor on its own resource group only. No Azure secrets or deployment tokens are stored in GitHub.
- Dependabot keeps npm packages and GitHub Actions up to date with weekly PRs (minor and patch grouped, majors separate, 14-day cooldown on new versions). It skips major updates to `@types/node`, which tracks the Node version we run (24), and to TypeScript until typescript-eslint supports TypeScript 7.
- The app shows its version from `git describe`: the release tag in production, the last tag plus commits since on test.

## Open questions

None right now.
