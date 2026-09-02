# CubeTimer

A fast, client-side speedcubing timer with strict progress analysis. Import [cstimer](https://cstimer.net/) sessions or time directly in the app — get a progress chart, a headline grade from 0–100, three sub-scores, and a coach that does not lie to you.

Everything runs client-side. No account, no storage, no telemetry: close the tab and your solves are gone.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit test suites
npm run build      # production build (fully static — Vercel-ready)
```

## Features

### Timer

- **Hold-to-start**: press and hold spacebar (or touch on mobile) for the configured delay before timing begins
- **Inspection mode**: optional WCA-style 15s countdown before solve
- **Blind mode**: hides the running time, shows "Solving..." — reveals the final time after solve ends
- **Phase colors**: red while holding (not ready), green when hold threshold met, default text otherwise
- **Scramble display**: large monospace scramble with wide letter spacing
- **Auto-hide sidebar**: sidebar collapses during solve for full focus, reappears after

### Sessions

- Create/delete/rename sessions per puzzle type (3x3, 2x2, Pyraminx, Square-1)
- Dropdown session picker sorted newest-first
- Session stats bar: best single, current/best ao5, current/best ao12
- Full solve list with +2 penalty, DNF, and delete actions
- Undo delete via toast notification

### Dashboard

Upload a cstimer export (.txt) → get a progress chart, scoring breakdown, and prescriptions.

- **Scoring model**: three sub-scores (improvement, consistency, frequency) weighted by skill level → headline grade
- **Chart**: session means with error bars, rolling ao5/ao12/ao100, trend line, projection
- **Prescriptions**: drills from primary coaching sources, targeted at your weakest axis

### Settings

- Start delay (0–2000ms)
- Inspection mode toggle + duration
- Sound effects (start/stop beeps)
- Hide timer (blind mode)
- Scramble lengths per puzzle type

### Themes

Dark → Light → Sticker. Sticker is the toy-box mode: cube-sticker-colored panels, rainbow wash. Preference persisted in localStorage.

## How your data is processed

1. **Parse** — sessions are read from the export JSON; each solve carries `[penaltyMs, timeMs, …splits], scramble, comment, timestamp`. Penalties (+2 s) are added to the raw time, DNFs excluded from all statistics, times floored to centiseconds like cstimer displays them.
2. **Type sessions** — puzzle type comes from scramble notation first (Square-1 `(n,m)` turns, wide moves for big cubes, short scrambles for 2x2, else 3x3), falling back to cstimer's `scrType` metadata.
3. **Merge & range-filter** — all sessions of the selected event merge into one chronological stream; the range selector (all/90/30/7 days) filters everything downstream.
4. **Score** — see below.

## The scoring model

Three sub-scores feed one headline number. Weights shift by your current level:

| Level | Improvement | Consistency | Frequency |
|---|---|---|---|
| sub-60 | 45% | 15% | 40% |
| sub-40 | 40% | 25% | 35% |
| sub-25 | 35% | 35% | 30% |
| sub-15 | 30% | 40% | 30% |
| sub-10 | 25% | 45% | 30% |

| Headline | Verdict |
|---|---|
| ≥ 80 | good |
| 60–79 | decent |
| 40–59 | bad |
| < 40 | horrible |

Full scoring rationale in [`docs/research-scoring.md`](docs/research-scoring.md) and [`docs/research-prescriptions.md`](docs/research-prescriptions.md).

## Testing & CI

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit test suites
npm run build       # production build
npm run e2e         # Playwright: uploads fixtures/synthetic-export.txt, asserts dashboard health
npm run fixture     # regenerate the synthetic export (deterministic; expected stats travel with it)
```

### Pipeline (GitHub Actions)

Two jobs in `.github/workflows/ci.yml`:

1. **gate** — every push to `main` and every PR: typecheck, unit suites, build, E2E against a local build.
2. **smoke-prod** — pushes to `main` and a nightly cron: waits until the live site serves the matching commit, then runs the same flow against production.

## Limitations

- Improvement needs ≥ 4 distinct active days spanning ≥ 2 weeks in range.
- Consistency needs ≥ 10 clean solves in range.
