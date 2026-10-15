# Roadmap

The living record of where the project stands. Update it whenever a task is finished, a decision is made, or the plan changes.

## Current status

The React + TypeScript app is scaffolded with Vite and `npm run dev` works. Vitest is installed (no tests yet), and a GitHub Actions CI workflow (`.github/workflows/ci.yml`: lint, test, build) is written but hasn't run on GitHub yet. The template's demo page is still in place. Next: push and confirm CI goes green, protect `main` with a ruleset, then set up deployment to Azure.

## Roadmap (draft)

- [ ] **Project setup:** scaffold the React app ✅, add Vitest ✅, add CI, protect `main`, deploy to Azure, clear out the template demo
- [ ] **Board:** render the 10×10 board with the two lakes
- [ ] **Setup phase:** player places their 8 pieces in their four starting rows; the computer places its own
- [ ] **Movement:** legal moves for each piece, including Scouts moving several squares in a straight line
- [ ] **Combat:** attacking, revealing ranks, and resolving who wins
- [ ] **Win conditions:** Flag captured, or no movable pieces left
- [ ] **Computer opponent:** an AI that sets up and plays
- [ ] **Polish:** visuals, animations, game-over screen, new game

## Decisions

- Single player against the computer.
- Front end only, no back end.
- Built with React and TypeScript, using Vite.
- The user does all `git add` / `git commit` manually.
- Trunk-based development: `main` is the trunk and should always build and pass tests.
- Hosted on Azure.

## Open questions

- Styling approach?
