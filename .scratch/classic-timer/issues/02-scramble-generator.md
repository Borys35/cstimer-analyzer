# 02: Scramble Generator

## What to build

A pure-function scramble generator for 3x3, 2x2, Pyraminx, and Square-1. Each puzzle has its own module. No UI dependency — just functions that return scramble strings.

## Acceptance criteria

- [ ] `generateScramble(puzzle, length)` function exported from barrel
- [ ] 3x3: WCA 20 moves from {U, D, L, R, F, B}, no consecutive same-axis moves, prime/non-prime randomly
- [ ] 2x2: WCA 11 moves from {U, R, F}
- [ ] Pyraminx: 8 moves from {U, L, R, B} + 4 random tip moves from {u, l, r, b}
- [ ] Square-1: random-move notation in `(top,bottom) / ` format (not WCA compliant, noted)
- [ ] Unit tests: correct move counts per puzzle, valid tokens, no same-axis consecutive moves (3x3/2x2)

## Blocked by

None (can start immediately).
