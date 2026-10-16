# Stratego Barrage

A web-based version of **Stratego Barrage**, the fast, small-army variant of the classic Stratego board game.

## What we're building

- **Single player** — you play against a computer opponent.
- **Front end only** — the whole game runs in the browser. There is no back end for now.
- **Built with React.**

## Releasing

Every merge to `main` deploys to the **test** site. To release to **production**, publish a GitHub Release with a new `v*` tag (e.g. `v0.1.0`) on `main`. Both sites are Azure Static Web Apps; the infrastructure is in [`infra/`](infra/README.md).

## About Stratego Barrage

Barrage is played on the standard 10×10 Stratego board, with the two lakes in the middle, but each player gets only 8 pieces instead of 40:

| Piece    | Rank | Count |
| -------- | ---- | ----- |
| Marshal  | 10   | 1     |
| General  | 9    | 1     |
| Miner    | 3    | 1     |
| Scout    | 2    | 2     |
| Spy      | S    | 1     |
| Bomb     | B    | 1     |
| Flag     | F    | 1     |

Each player places their pieces in secret within their own four starting rows. You win by capturing the opponent's Flag, or when your opponent has no movable pieces left.
