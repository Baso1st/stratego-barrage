# Roadmap

The living record of where the project stands. Update it whenever a task is finished, a decision is made, or the plan changes.

## Current status

The React + TypeScript app is scaffolded with Vite and `npm run dev` works. Vitest is installed (no tests yet), and the GitHub Actions CI workflow (`.github/workflows/ci.yml`: lint, test, build) runs green on GitHub, and `main` is protected by a ruleset. The Azure infrastructure (Bicep, in `infra/`) is bootstrapped (Pay-As-You-Go subscription, `centralus`), and the CD pipeline works end to end. Merges to `main` deploy to test (https://ambitious-sky-0c8060710.3.azurestaticapps.net/), and `v0.1.0` is released to production (https://lively-desert-0006fa410.6.azurestaticapps.net/). The template's demo page is still in place. Next: clear out the template demo, then start on the board.

## Roadmap (draft)

- [ ] **Project setup:** scaffold the React app ✅, add Vitest ✅, add CI ✅, protect `main` ✅, deploy to Azure (test and production) ✅, clear out the template demo
The React + TypeScript app is scaffolded with Vite and `npm run dev` works. Vitest is installed (no tests yet), and the GitHub Actions CI workflow (`.github/workflows/ci.yml`: lint, test, build) runs green on GitHub, and `main` is protected by a ruleset. The Azure infrastructure (Bicep, in `infra/`) and the CD workflows (`deploy.yml`, `release.yml`) are written but haven't run yet. The bootstrap has been run (Pay-As-You-Go subscription, `centralus`), so the resource groups and deploy identities exist, and the GitHub `test` and `production` environments and secrets are set up. The template's demo page is still in place. Next: merge the pipeline in a PR (first deploy to test), then publish `v0.1.0`.

## Roadmap (draft)

- [ ] **Project setup:** scaffold the React app ✅, add Vitest ✅, add CI ✅, protect `main` ✅, deploy to Azure (test and production), clear out the template demo
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
- Hosted on Azure Static Web Apps, with two environments:
  - **Test:** every merge to `main` deploys here automatically.
  - **Production:** publishing a GitHub Release with a `v*` tag (e.g. `v0.1.0`) on a `main` commit deploys that commit here, after the user approves the deployment in GitHub (required reviewer on the `production` environment).
- Infrastructure as code in Bicep (`infra/`). The CD pipeline applies `infra/main.bicep` on every deployment, so infra changes are promoted from test to production like app changes. A one-time bootstrap, run by hand, creates the resource groups and the identities GitHub Actions signs in as.
- GitHub Actions signs in to Azure with OIDC: one managed identity per environment, each Contributor on its own resource group only. No Azure secrets or deployment tokens are stored in GitHub.
- Dependabot keeps npm packages and GitHub Actions up to date with weekly PRs (minor and patch grouped, majors separate, 14-day cooldown on new versions). It skips major updates to `@types/node`, which tracks the Node version we run (24), and to TypeScript until typescript-eslint supports TypeScript 7.
- The app shows its version from `git describe`: the release tag in production, the last tag plus commits since on test.

## Open questions

- Styling approach?
