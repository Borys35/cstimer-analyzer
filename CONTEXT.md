# CubeTimer — Domain Glossary

## Core concepts

- **Session**: A named collection of solves for a specific puzzle type. Has `name`, `puzzleType`, `createdAt`, `endedAt`, and `solves`. Sessions are ordered by `createdAt` descending in the dropdown.
- **Solve**: A single timed attempt. Has `timeMs` (raw), `penalty` (0 = none, n>0 = +2n seconds), `dnf` (did not finish), `scramble`, `dateSec`. Display time = `timeMs + penalty * 2000`.
- **Scramble**: A random sequence of moves generated per puzzle type. Stored in the solve record. History is session-scoped; prev/next navigation cycles through all scrambles (used and unused).

## Timer phases

- **idle**: Timer waiting for input.
- **armed**: Hold in progress, waiting for start delay threshold.
- **running**: Timer actively counting.
- **inspection**: WCA-style 15s countdown before solve.

## Statistics

- **Mean**: Average of all non-DNF solve times (penalties applied).
- **Ao5 / Ao12**: WCA trimmed average — drop best and worst, mean the rest. Multiple DNFs in window = DNF average.
- **CV (Coefficient of Variation)**: Population std dev / mean. Unitless ratio displayed as percentage. Lower = more consistent.
- **Std Dev**: Population standard deviation of solve times (penalties applied). Displayed in seconds.

## UI components

- **SessionSidebar**: Desktop fixed panel, mobile slide-in overlay. Contains dropdown picker, stats bar, solve table.
- **SolveTable**: `<table>` with columns #, Time, Ao5, Ao12. Click opens SolveDetailModal.
- **SolveDetailModal**: Shows time, date, scramble, +2/DNF/delete controls.
- **TimerPage**: Centered scramble display with prev/next arrows, timer, phase label.
