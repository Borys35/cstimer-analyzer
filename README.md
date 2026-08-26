# cstimer analyzer

Upload a [cstimer](https://cstimer.net/) export (.txt) → get a progress chart, a headline grade from 0–100, three sub-scores, and a coach that does not lie to you.

Everything runs client-side. No account, no storage, no telemetry: close the tab and your solves are gone.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run verify     # cross-checks the parser against cstimer's own session stats
npm run build      # production build (fully static — Vercel-ready)
```

To export from cstimer: **Options → Export → .txt**, then drop the file onto the upload zone.

## How your data is processed

1. **Parse** — sessions are read from the export JSON; each solve carries `[penaltyMs, timeMs, …splits], scramble, comment, timestamp`. Penalties (+2 s) are added to the raw time, DNFs excluded from all statistics, times floored to centiseconds like cstimer displays them.
2. **Type sessions** — puzzle type comes from scramble notation first (Square-1 `(n,m)` turns, wide moves for big cubes, short scrambles for 2x2, else 3x3), falling back to cstimer's `scrType` metadata, because metadata can be stale (it records the setting at session creation). Wrong guesses can be fixed per-session in the UI.
3. **Merge & range-filter** — all sessions of the selected event merge into one chronological stream; the range selector (all/90/30/7 days) filters everything downstream.
4. **Score** — see below.

## The scoring model

Three sub-scores feed one headline number:

```
headline = 0.4·improvement + 0.3·consistency + 0.3·frequency
(missing sub-scores are skipped and weights renormalised)
```

| Headline | Verdict |
|---|---|
| ≥ 80 | good |
| 60–79 | decent |
| 40–59 | bad |
| < 40 | horrible |

The grades are deliberately strict. The anchors below are calibrated against measured cubing data — solve logs, WCA cohort analyses, community surveys — summarised in [`docs/research-scoring.md`](docs/research-scoring.md). Where public data was thin, anchors were set on the demanding side of the adjacent evidence and are marked as proposals there.

Design rule: **rolling ao5/ao12/ao100 are decoration; every judgement is computed in time buckets** (daily means → weekly trend), so low-volume days still count proportionally.

### Improvement — weight 40%

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

### Consistency — weight 30%

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

### Frequency — weight 30%

Trailing 14 calendar days, regardless of the range selector (habits are habits):

```
score = 0.7 · f(activeDays) + 0.3 · g(solvesPerActiveDay)
f: 2 days→20, 5→50, 10→85, 11→90, 14→100
g: 10/day→30, 20→60, 50→90, 100+→100
```

Why: self-reported improving cubers train roughly an hour most days (~20–100 solves/day); >200/day shows no extra benefit and reads as mindless volume. Eleven-plus active days per fortnight is the top band — the difference between decent and good is usually the days you skipped.

### Focus list

The three sub-scores are listed worst-first with targeted advice. The advice quotes your actual numbers (ms/week, CV%, active days) — it is harsh about facts, never invented insults.


## Prescriptions

The worst-scoring axis gets a full prescription: 2-3 specific drills, the rationale for each, and a recovery estimate computed from your own solves � never generic numbers:

- **Consistency**: gap between your average and your best-quartile solves, plus the cost of excess spread ((CV - 10%) � mean)
- **Splits** (3x3): your median cross/F2L/OLL/PLL time share vs coaching-reference shares (12/50/19/19%), converted to seconds at your level
- **Improvement**: where your fitted trend lands in 8 weeks vs holding a -1%/week pace
- **Frequency**: active days missing from the top band, translated into solves per fortnight

Prescription selection is a deterministic matrix: level band (30s+ / 20�30s / 13�20s / sub-13) � weakest axis. Other events use one generic track per axis.

Split analysis only counts clean, unpenalized solves carrying exactly three phase marks (cstimer multi-phase: Cross / F2L / OLL / PLL), needs =25 of them in range, and degrades gracefully � a hint tells you when to switch the timer's multi-phase mode on.

## Chart

- **Grey dots** — individual clean solves
- **Blue/indigo/green lines** — rolling ao5/ao12/ao100 over the chronological stream (windows span across low-volume days instead of breaking)
- **Amber line** — the fitted trend through daily means
- **Red dashed line** — the same fit extrapolated over your chosen horizon
- **Dark bars** — solve volume per day/week

Y axis is inverted-friendly: lower = faster = better.

## Verification

`npm run verify` re-parses the bundled sample export and checks every session's solve count, DNF count, and mean against cstimer's own stored stats — the parser reproduces all of them to sub-centisecond precision.

## Limitations

- Improvement needs ≥ 4 distinct active days spanning ≥ 2 weeks in range; otherwise that sub-score reports n/a and the other two carry the headline.
- Consistency needs ≥ 10 clean solves in range.
- No public large-N benchmarks exist for consistency distributions, beginner-level CV, practice dose–response, or active-days norms — those anchors rest on smaller samples and adjacent evidence (details and confidence labels in the research doc).
- Phase splits (CFOP steps) are already parsed and stored but unused — planned for v2 step-level diagnosis.
