# ADR-0001: Puzzle-type classification precedence

## Status

Accepted (supersedes the scramble-heuristics-first order that shipped with the initial parser)

## Context

A cstimer export records each session's scramble type in `properties.sessionData[n].opt.scrType`, but this metadata is written when the session is created and is not always trustworthy: real exports have been observed where sessions tagged `222so` contained unambiguous 3x3 scrambles and 3x3-paced solve times. Conversely, heuristic guesses from scramble notation alone misfile any event whose scrambles are short or unusual (Pyraminx, Skewb) whenever authoritative `scrType` data exists.

Two lessons therefore had to hold at once:

1. Scramble notation is ground truth about what was actually solved.
2. `scrType` is usually the most specific signal — except when it demonstrably contradicts the scrambles.

## Decision

`classifySession(solves, scrType)` resolves type in this order:

1. **Strong scramble signals** override everything: Square-1 pair-tuple patterns on every sampled scramble, or wide-move tokens (`Rw`) on any sample → Square-1 / 4x4 respectively. If the scrambles physically cannot be 2x2/3x3, no metadata can overrule them.
2. **`scrType` mapping** via the known-code table, unless contradicted: a session tagged as 2x2 whose scrambles run longer than 16 tokens is treated as stale metadata and falls through to heuristics.
3. **Weak scramble heuristics**: token-count cutoff for 2x2, default 3x3 otherwise.

The decision table is exported (`classifySession`, `typeFromScrambles` stays internal) so tests exercise the policy directly rather than through whole-file parsing.

## Consequences

- Sessions whose `scrType` lies about a big-cube event are still caught by wide-move signals; lying about 2x2 is caught by the token-count contradiction guard.
- Events with genuinely short scrambles but no `scrType` remain ambiguous against 2x2 (Skewb ≈ Skewb only if `scrType` present); manual per-session override in the UI remains the escape hatch.
- `scripts/verify.ts` asserts detected types against `opt.scrType` wherever a clean mapping exists, so future precedence changes are policed by the existing oracle.
