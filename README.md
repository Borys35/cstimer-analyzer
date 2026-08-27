# cstimer analyzer

Upload a [cstimer](https://cstimer.net/) export (.txt) → get a progress chart, a headline grade from 0–100, three sub-scores, and a coach that does not lie to you.

Everything runs client-side. No account, no storage, no telemetry: close the tab and your solves are gone.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # parser-vs-cstimer ground truth + chart + prescriptions suites
npm run build      # production build (fully static — Vercel-ready)
```

To export from cstimer: **Options → Export → .txt**, then drop the file onto the upload zone.

## How your data is processed

1. **Parse** — sessions are read from the export JSON; each solve carries `[penaltyMs, timeMs, …splits], scramble, comment, timestamp`. Penalties (+2 s) are added to the raw time, DNFs excluded from all statistics, times floored to centiseconds like cstimer displays them.
2. **Type sessions** — puzzle type comes from scramble notation first (Square-1 `(n,m)` turns, wide moves for big cubes, short scrambles for 2x2, else 3x3), falling back to cstimer's `scrType` metadata, because metadata can be stale (it records the setting at session creation). Wrong guesses can be fixed per-session in the UI.
3. **Merge & range-filter** — all sessions of the selected event merge into one chronological stream; the range selector (all/90/30/7 days) filters everything downstream.
4. **Score** — see below.

## The scoring model

Three sub-scores feed one headline number. Weights shift by your current level — improvement matters most when you're fast, consistency matters most when you're fast:

```
headline = w_improvement·improvement + w_consistency·consistency + w_frequency·frequency
(missing sub-scores are skipped and weights renormalised)
```

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

The grades are deliberately strict. The anchors below are calibrated against measured cubing data — solve logs, WCA cohort analyses, community surveys — summarised in [`docs/research-scoring.md`](docs/research-scoring.md) and [`docs/research-prescriptions.md`](docs/research-prescriptions.md). Where public data was thin, anchors were set on the demanding side of the adjacent evidence and are marked as proposals there.

Design rule: **rolling ao5/ao12/ao100 are computed from session means; trend/projection are computed from individual solves**, so the chart shows session-level signal while the trend stays statistically accurate even with few sessions.

### Improvement — level-adaptive weight

The trend of daily mean solve times is fitted with a count-weighted least-squares regression over the selected range, then judged **relative to your current level** (mean of your last 50 clean solves):

```
pctPerWeek = -(slope ms/day × 7) / currentLevel × 100
```

| pctPerWeek (negative = slowing down) | Score |
|---|---|
| ≥ −0.5% or worsening | ≤ 10 |
| ~0 (flat) | 22 |
| −0.3%/week | 35 |
| −0.7%/week | 60 |
| −1.5%/week | 85 |
| −3%/week | 96 (cap) |

Why these numbers: WCA cohort data shows beginners typically drop to half their entry time within ~6 months (**≈ −2.7%/week**) and then stall; long-run sustained improvement for established solvers is closer to **−0.3 to −0.45%/week**. Flat therefore scores 22, not 50 — maintenance is not training. Rates beyond −3%/week are capped because they either belong to beginners (where they end anyway) or to noisy windows, and the coach says so.

Level-appropriate expectations (from coaching research):
- **sub-60**: −1.5 to −3%/week is normal; rapid gains from method changes
- **sub-40**: −0.8 to −1.5%/week; F2L efficiency is the main lever
- **sub-25**: −0.3 to −0.7%/week; improvement slows as lookahead matures
- **sub-15**: −0.1 to −0.4%/week; gains come from efficiency margins
- **sub-10**: −0.05 to −0.2%/week; even tiny slopes compound over years

### Consistency — level-adaptive weight

Coefficient of variation of your last 50 clean solves in range:

```
CV = stddev(times) / mean(times)
```

| CV | Score |
|---|---|
| ≤ 4% | 100 (flagged as implausible — real logs almost never sit here) |
| 7% | 90 |
| 9% | 75 |
| 12% | 55 |
| 15% | 40 |
| 25% | 20 |
| ≥ 45% | 0 |

Why: measured logs cluster at **8–15% CV at every skill level** — dispersion scales with the average, so relative spread barely improves as you get faster. Community convention calls <10% "good" and <5% "really good"; the anchors treat par (~9–12%) as 55–75, not as excellence. If you scored 84 under the old lenient scale, you will score ≈ 40 now — that is the intended correction, not a bug.

### Frequency — level-adaptive weight

Trailing 14 calendar days, regardless of the range selector (habits are habits):

```
score = 0.7 · f(activeDays) + 0.3 · g(solvesPerActiveDay)
f: 2 days→20, 5→50, 7→70, 10→82, 12→90, 14→100
g: 10/day→30, 20→60, 50→90, 100+→100
```

Why: self-reported improving cubers train roughly an hour most days (~20–100 solves/day); >200/day shows no extra benefit and reads as mindless volume. The curve flattens above 7 active days — going from 10 to 14 adds only ~18 points, reflecting diminishing returns. Five-to-seven sessions per week is the sweet spot for most levels; beyond that, quality dominates over quantity.

Level-appropriate frequency targets (from coaching research):
- **sub-60**: 3–5 sessions/week (20–30 min each); habit formation is the priority
- **sub-40**: 5–7 sessions/week (30–60 min); 100 solves/day is the volume target
- **sub-25**: 5–7 sessions/week (45–90 min); structured beats volume
- **sub-15**: 5–7 sessions/week (60–120 min); fatigue reduces gains past 2 hrs/day
- **sub-10**: 5–7 sessions/week (60–120 min) of structured practice; unstructured volume adds almost nothing

## Prescriptions

The worst-scoring axis gets a full prescription: 2–3 specific drills with sources, the rationale for each, and a recovery estimate computed from your own solves — never generic numbers:

- **Consistency**: gap between your average and your best-quartile solves, plus the cost of excess spread (`(CV − 10%) × mean`)
- **Splits** (3x3): your median cross/F2L/OLL/PLL time share vs coaching-reference shares, converted to seconds at your level
- **Improvement**: where your fitted trend lands in 8 weeks vs holding a −1%/week pace
- **Frequency**: active days missing from the top band, translated into solves per fortnight

Prescription selection is a deterministic matrix: level band × weakest axis. Five bands for 3x3, each with research-backed drills from primary coaching sources (Zubin Park, J Perm, CuberPal, Caiden Lee, SpeedSolving training threads):

| Band | Time range | #1 bottleneck |
|---|---|---|
| sub-60 | 60+ s | Method efficiency — switch to CFOP, learn intuitive F2L |
| 30s+ | 30–60 s | F2L efficiency + 2-look OLL/PLL drilling |
| 20-30s | 20–30 s | Cross-to-F2L transition + lookahead initiation |
| 13-20s | 13–20 s | F2L fluidity + OLL/PLL recognition speed |
| sub-13 | < 13 s | Micro-optimization + advanced subsets (COLL, ZBLL) |

Other events use one generic track per axis. Full drill list and sources in [`docs/research-prescriptions.md`](docs/research-prescriptions.md).

Split analysis only counts clean, unpenalized solves carrying exactly three phase marks (cstimer multi-phase: Cross / F2L / OLL / PLL), needs ≥25 of them in range, and degrades gracefully — a hint tells you when to switch the timer's multi-phase mode on.

## Chart

Each dot is a session (not an individual solve):

- **Colored dots** — session mean times; color encodes CV (green < 8% → yellow < 12% → orange < 18% → red); dot size scales with solve count (√ scale); green ring outline on PB-mean sessions
- **Error bars** — ±1 standard deviation from the session mean
- **Blue/indigo/green lines** — rolling ao5/ao12/ao100 computed from session means
- **Amber line** — the fitted trend through daily means (computed from individual solves for accuracy)
- **Red dashed line** — the same fit extrapolated over your chosen horizon
- **Dark bars** — solve volume per day/week

Hover a session dot for: mean, best single, best ao5/ao12, solve count, std dev, CV%, session rank, and delta vs your overall average. Hover the trend/projection line for the predicted time on that day.

Y axis is inverted-friendly: lower = faster = better.

## Themes

One toggle cycles **Dark → Light → Sticker**. Sticker is the toy-box mode: cube-sticker-colored panels, rainbow wash, animated tile hero. Charts keep semantic colors and neutral plot areas in every theme. Preference is remembered locally; first visit follows your system preference.

## Testing & CI

```bash
npm run typecheck   # tsc --noEmit
npm test            # parser-vs-cstimer ground truth + chart-rows + prescriptions suites
npm run build       # production build
npm run e2e         # Playwright: uploads fixtures/synthetic-export.txt, asserts dashboard health
npm run fixture     # regenerate the synthetic export (deterministic; expected stats travel with it)
```

Run all four before pushing — it is the same sequence CI runs.

### Pipeline (GitHub Actions)

Two jobs in `.github/workflows/ci.yml`:

1. **gate** — every push to `main` and every PR: typecheck, unit suites, build, E2E against a local build.
2. **smoke-prod** — pushes to `main` and a nightly cron (`03:00 UTC`, fired by GitHub's scheduler): waits until the live site serves `<meta name="git-sha">` matching the pushed commit (Vercel injects it at build time; poll window 10 min), then runs the same upload-and-assert flow against production.

The URL is overridable via the `PROD_URL` repo variable without code changes.

## Verification

`npm run verify` re-parses an export and checks every session's solve count, DNF count, and mean against cstimer's own stored stats — the parser reproduces all of them to sub-centisecond precision.

## Limitations

- Improvement needs ≥ 4 distinct active days spanning ≥ 2 weeks in range; otherwise that sub-score reports n/a and the other two carry the headline.
- Consistency needs ≥ 10 clean solves in range.
- No public large-N benchmarks exist for consistency distributions, beginner-level CV, practice dose–response, or active-days norms — those anchors rest on smaller samples and adjacent evidence (details and confidence labels in the research doc).
