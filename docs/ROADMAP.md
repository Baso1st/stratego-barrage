# Roadmap

The living record of where the project stands. Update it whenever a task is finished, a decision is made, or the plan changes.

## Current status

The repository is set up with a README and CLAUDE.md. No application code yet.

## Roadmap (draft)

- [ ] **Project setup:** scaffold the React app
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
- Built with React.
- The user does all `git add` / `git commit` manually.

## Open questions

- JavaScript or TypeScript?
- Build tool (e.g. Vite)?
- Styling approach?
- Where it will be hosted, if anywhere?
