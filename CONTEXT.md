# CubeTimer — Domain Glossary

## Core concepts

- **Session**: A named collection of solves for a specific puzzle type. Has `name`, `puzzleType`, `createdAt`, `endedAt`, and `solves`. Sessions are ordered by `createdAt` descending in the dropdown.
- **Solve**: A single timed attempt. Has `timeMs` (raw), `penalty` (0 = none, n>0 = +2n seconds), `dnf` (did not finish), `scramble`, `dateSec`. Display time = `timeMs + penalty * 2000`.
- **Scramble**: A random-state sequence of moves generated per puzzle type via cubing.js (WCA standard). Stored in the solve record. History is session-scoped; prev/next navigation cycles through all scrambles (used and unused).

## Timer phases

- **idle**: Timer waiting for input.
- **armed**: Hold in progress, waiting for start delay threshold.
- **running**: Timer actively counting.
- **inspection**: WCA-style 15s countdown before solve.

## Statistics

- **Mean**: Average of all non-DNF solve times (penalties applied).
- **Median**: Middle value of the same clean solve times (penalties applied). Insensitive to single blow-ups.
- **Ao5 / Ao12**: WCA trimmed average — drop best and worst, mean the rest. Multiple DNFs in window = DNF average.
- **rCV (MAD)**: Robust coefficient of variation — `1.4826 × median(|xᵢ − median|) / median`. Unitless ratio displayed as percentage; lower = more consistent. One large outlier can't wreck it, so it replaces plain std-dev CV as the consistency metric. Computed for ≥3 clean times; backs `consistencyScore` and the chart's `sessionCv`.
- **IQR ratio**: `(Q3 − Q1) / median` (interquartile range over the median), displayed as percentage; requires ≥3 clean times.
- **Std Dev**: Population standard deviation of solve times (penalties applied). Displayed in seconds.

## UI components

- **SessionSidebar**: Desktop fixed panel, mobile slide-in overlay. Contains dropdown picker, stats bar, solve table.
- **SolveTable**: `<table>` with columns #, Time, Ao5, Ao12. Click opens SolveDetailModal.
- **SolveDetailModal**: Shows time, date, scramble, +2/DNF/delete controls. +2 and DNF are mutually exclusive — toggling one clears the other.
- **TimerPage**: Centered scramble display with prev/next arrows, timer, phase label. The next arrow generates a fresh scramble once the session's history is exhausted.
