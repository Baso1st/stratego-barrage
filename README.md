# Stratego Barrage

A web-based version of **Stratego Barrage**, the fast, small-army variant of the classic Stratego board game.

## What we're building

- **Single player** — you play against a computer opponent.
- **Front end only** — the whole game runs in the browser. There is no back end for now.
- **Built with React and TypeScript**, using Vite.

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

## Getting started

You need [Node.js](https://nodejs.org/) 24 (the version CI uses) and Git.

```sh
git clone https://github.com/Baso1st/stratego-barrage.git
cd stratego-barrage
npm ci
npm run dev
```

Then open http://localhost:5173. The page updates as you edit files in `src/`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the tests once (Vitest) |
| `npm run test:watch` | Re-run the tests as files change |
| `npm run lint` | Lint with ESLint |
| `npm run build` | Type-check, then build the site into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

Before you push, run `npm run lint`, `npm test` and `npm run build`. CI runs the same checks and won't let a PR merge until they pass.

## Day-to-day workflow

We use trunk-based development. `main` is the trunk: it always builds and passes its tests, and every change reaches it through a short-lived branch and a pull request.

1. Start a branch from the latest `main`:
   ```sh
   git switch main
   git pull
   git switch -c <short-descriptive-name>
   ```
2. Commit your work and push the branch: `git push -u origin <branch>`.
3. Open a pull request into `main`. The **CI / build** check lints, tests and builds it, and must pass before you can merge.
4. **Squash and merge**, the only merge method allowed. GitHub deletes the branch for you.
5. The merge deploys to the **test** site automatically. Check your change there.

Keep branches small and merge them within a day or two, so they don't drift from `main`. If `main` moves on while your PR is open, click **Update branch** on the PR.

`main` is protected by a ruleset: no direct or force pushes, linear history only, and a PR can only merge when CI passes and the branch is up to date.

**Dependabot** opens PRs each week to update npm packages and GitHub Actions: one grouped PR for minor and patch updates, and a PR per major update. It waits until a new version is two weeks old before proposing it. Treat its PRs like any other: let CI pass, merge, and check test. If one falls behind `main`, click **Update branch** or comment `@dependabot rebase`.

## Releasing to production

Production changes only when a release is published and approved.

1. Check that the changes look right on the test site.
2. On GitHub, go to **Releases → Draft a new release**.
3. Under **Choose a tag**, type the next version and pick **Create new tag on publish**, with `main` as the target. Bump the patch number for fixes (`v0.1.1`) and the minor number for new features (`v0.2.0`).
4. Click **Generate release notes**, then **Publish release**.
5. In **Actions**, open the new **Release** run. When it shows **Waiting for review**, click **Review deployments**, tick **production**, and click **Approve and deploy**.

The release workflow checks that the tag is on `main`, rebuilds that commit, and deploys it. Release tags (`v*`) can't be moved or deleted.

**To roll back**, open the **Release** run for the previous version in **Actions**, click **Re-run all jobs**, and approve the deploy. That puts the older version back in production.

## Environments

| Environment | URL | Updated when |
| --- | --- | --- |
| Test | https://ambitious-sky-0c8060710.3.azurestaticapps.net/ | Every merge to `main` |
| Production | https://lively-desert-0006fa410.6.azurestaticapps.net/ | A release is published and approved |

Each site shows the version it's running in its bottom-right corner, from `git describe`. Production shows its release tag, like `v0.2.0`. Test shows the last release plus what's been merged since, like `v0.2.0-3-gabc1234`: 3 commits after `v0.2.0`, at commit `abc1234`. A local build ends in `-dirty` when you have uncommitted changes.

Both are Azure Static Web Apps on the Free tier. The infrastructure is code, in [`infra/`](infra/README.md), and changes to it ship the same way as app changes: to test on merge, to production on release. You only need the Azure CLI if you change `infra/`; check your change compiles with `az bicep build --file infra/main.bicep`.

## Project layout

| Path | What's there |
| --- | --- |
| `src/` | The React app |
| `infra/` | Azure infrastructure, in Bicep |
| `.github/workflows/` | The CI, deploy and release pipelines |
| `docs/ROADMAP.md` | Current status, roadmap and decisions |
