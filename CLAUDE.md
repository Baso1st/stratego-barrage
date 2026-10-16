# CLAUDE.md

Instructions for Claude Code when working in this repository.

## Project

A web-based, single-player version of Stratego Barrage where you play against the computer. It is front end only (no back end) and built with React and TypeScript on Vite. See `README.md` for the game overview.

## Rules

- **Never run `git add` or `git commit`.** The user stages and commits all changes manually. Leave changes in the working tree for them to review.

## Roadmap

`docs/ROADMAP.md` tracks the current status, roadmap, project decisions, and open questions. It's the only place progress is tracked. It is imported below so it loads at the start of every session.

- Work through the roadmap items in order, one at a time: finish one before starting the next.
- Keep it up to date: tick off items as they're finished, record project decisions as they're made, and keep "Current status" saying what's being worked on.
- Before starting new work, check it to see where things stand.

@docs/ROADMAP.md

## Game design

`docs/GAME_DESIGN.md` describes how the game works and how it's built: the rules, the system design, the UI, and the game design decisions.

- Read it before working on the game, and build to match it.
- Update it whenever a design decision is made or changes, so it always matches the game.
- It covers only what we're building now. Leave ideas for the future out of it.
- It doesn't track progress; the roadmap does.

## Feature plans

`PLAN.md` is reserved for per-feature plans. The user asks for one at the start of a feature and deletes it when the feature is done. Don't use that name for anything else, and don't track progress in it; the roadmap does that.
