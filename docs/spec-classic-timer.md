## Problem Statement

The cstimer-analyzer is currently a post-hoc analysis tool only. Users must solve on csTimer, export a .txt file, and upload it here. There is no built-in timer, no local session persistence, no route architecture, and no path toward user accounts or subscriptions. Users want a self-contained cubing practice app that can replace csTimer for timing while retaining the existing analysis capabilities.

## Solution

Add a full-featured timer page with WCA-compliant scramble generation, csTimer-compatible session management persisted to localStorage, route architecture separating timer/stats/settings, and a data layer designed for future cloud sync and authentication.

The timer supports 3x3, 2x2, Pyraminx, and Square-1. Sessions use csTimer's naming convention (date-based), are stored in a single localStorage key, and are importable/exportable in csTimer's .txt format. The existing Dashboard becomes the stats view with a session filter added. A settings page provides timer config, theme, data management, and an account placeholder.

## User Stories

1. As a cuber, I want to time my solves using spacebar hold-to-start so that I can practice without leaving the app
2. As a mobile user, I want to time my solves using touch input so that I can practice on my phone
3. As a cuber, I want a configurable start delay (0-2s, default 0.5s) so that I can adjust the ready period to my preference
4. As a cuber, I want WCA-compliant scrambles for 3x3 (20 moves), 2x2 (11 moves), and Pyraminx (8+4 tips) so that my practice matches competition conditions
5. As a cuber, I want random-move Square-1 scrambles so that I can practice Square-1 even though a full WCA random-state generator is not yet implemented
6. As a cuber, I want the next scramble to auto-generate after each solve so that my practice flow is uninterrupted
7. As a cuber, I want to see my rolling ao5 and ao12 below the timer so that I can track my current session performance at a glance
8. As a cuber, I want +2, DNF, and Delete buttons accessible after each solve so that I can correct penalties without leaving the timer view
9. As a cuber, I want sessions named like Session_310826_02 (date-based with daily counter) so that I can organize my practice chronologically
10. As a cuber, I want to switch back to a previous session and continue solving in it so that I can resume interrupted practice sessions
11. As a cuber, I want the timer to auto-switch puzzle type when I select a different session so that scrambles match the session's puzzle
12. As a cuber, I want a sidebar listing all sessions with the active one highlighted so that I can navigate between sessions quickly
13. As a mobile user, I want the sidebar to collapse behind a hamburger icon so that screen space is preserved
14. As a cuber, I want a puzzle selector (tab bar or dropdown) on the timer page so that I can quickly switch which puzzle I'm solving
15. As a cuber, I want configurable scramble lengths per puzzle (with WCA defaults) so that I can use shorter scrambles for warm-ups
16. As a cuber, I want optional start/stop beep sounds (Web Audio API, default off) so that I can have audio feedback during practice
17. As a csTimer user, I want to import .txt export files so that my existing solve history is available in this app
18. As a user with existing in-app sessions, I want imports to merge with my data (duplicate detection by session name + first solve timestamp) so that I don't lose local solves
19. As a cuber, I want to export my sessions in csTimer's .txt format so that I can import them into csTimer or other compatible tools
20. As a user, I want sessions from timer and stats routes to share the same data so that my experience is consistent across the app
21. As a user, I want the existing Dashboard analysis to work with timer-created sessions so that I get insights on all my solves
22. As a user, I want a session filter on the stats page so that I can drill into specific session statistics
23. As a cuber, I want configurable inspection time (0-15s, default off) with optional WCA-style beeps at 8s/12s/15s so that I can practice competition conditions
24. As a user, I want settings organized into Timer, Appearance, Data, and Account sections so that configuration is easy to find
25. As a user, I want theme persistence (dark/light/sticker) carried over from the current implementation so that my preference is preserved
26. As a future user, I want the data layer behind a StorageAdapter interface so that cloud sync can be added without rewriting components
27. As a future user, I want an Account section in settings (placeholder) so that authentication can be added later
28. As a cuber, I want start/stop beeps toggleable in settings (default off) so that I can control audio feedback
29. As a user, I want a single localStorage key (cstimer-analyzer) containing sessions, activeSessionId, and settings so that data is atomic and simple
30. As a cuber, I want the timer display to show large centered time in mm:ss.ms format so that it is readable during fast solves
31. As a user, I want routes to be real Next.js App Router pages so that URLs are deep-linkable and bookmarkable
32. As a cuber, I want penalty buttons (+2, DNF) and delete to appear near the recorded time in the session sidebar so that I can correct solves quickly
33. As a user, I want a confirmation toast when importing (Imported 3 sessions, 2 duplicates skipped) so that I know the import result
34. As a cuber, I want to create new sessions from the sidebar so that I can start fresh practice groups
35. As a cuber, I want to end a session (timestamp it) so that it is clearly separated from future solves
36. As a cuber, I want to rename sessions so that I can add meaningful labels beyond the auto-generated name
37. As a cuber, I want to delete sessions so that I can clean up unwanted data
38. As a user, I want the timer page at / (root) since it is the primary view I will use most
39. As a user, I want the stats/dashboard at /stats so that analysis is a distinct destination
40. As a user, I want settings at /settings so that configuration is separated from the main workflow
41. As a cuber, I want the timer to feel fluid with no overlays or toasts between solves so that my rhythm is not interrupted
42. As a user, I want future authentication to be implementable by swapping the StorageAdapter without changing any component code
43. As a cuber, I want scramble notation to follow WCA conventions for each puzzle type so that scrambles are recognizable and standard
44. As a user, I want the app to remain fully functional offline since it currently has no server-side dependencies
45. As a cuber, I want the sidebar session list to show each session's puzzle type so that I can identify sessions at a glance

## Implementation Decisions

### Architecture

- **Route structure**: Real Next.js App Router pages at `/` (timer), `/stats` (dashboard), `/settings` (config). Each page is a client component.
- **Shared state**: `SessionProvider` React Context in `layout.tsx` wrapping all routes. Loads from localStorage on mount, auto-saves on state change. Exposes sessions, activeSessionId, addSolve, createSession, endSession, etc.
- **Storage**: Single localStorage key `cstimer-analyzer` with JSON blob: `{ sessions, activeSessionId, settings }`. One parse on load, one stringify on save.
- **StorageAdapter interface**: TypeScript interface defined now with `load()`, `save()`, `deleteSession()` etc. Initial implementation uses localStorage. Ready for cloud adapter swap later without component changes.

### Timer

- **Input**: Spacebar hold-to-start (hold to arm, release to start timing) + touch tap. Penalty buttons (+2, DNF) and delete appear in the sidebar next to the recorded solve.
- **Start delay**: Configurable 0-2 seconds, default 0.5s. Prevents accidental early starts.
- **Post-solve flow**: csTimer-style — time recorded, next scramble auto-generates immediately. No overlays, no toasts, no interrupts. Time appears in sidebar instantly.
- **Display**: Large centered time (mm:ss.ms), scramble text above, session stats (rolling ao5, ao12) below the time.
- **Sounds**: Start and stop beeps via Web Audio API (simple tone generation, no audio files). Default off, toggle in settings.

### Sessions

- **Model**: csTimer-compatible. One active session accepts all new solves. Any past session can be reactivated by selecting it from the sidebar.
- **Naming**: Date-based format `Session_DDMMYY_NN` where NN is the daily counter (e.g., `Session_310826_02` for the second session on Aug 31, 2026).
- **Puzzle binding**: Each session stores its puzzle type. Selecting a session auto-switches the timer's puzzle type and scramble generator.
- **Sidebar**: Left panel with session list (active highlighted), inline actions (new, end, rename, delete per session). Collapses to hamburger on mobile.

### Scrambles

- **Generator**: Per-puzzle files in `scramble/` directory with barrel `index.ts`. Single `generateScramble(puzzle, length)` function.
- **Puzzles**: 3x3 (WCA 20 moves), 2x2 (WCA 11 moves), Pyraminx (WCA 8 moves + 4 tips), Square-1 (random-move notation, not WCA compliant — noted for future improvement).
- **Lengths**: Configurable per puzzle in settings with WCA defaults pre-filled.

### csTimer Compatibility

- **Import**: .txt file upload via FileReader API. Merge with existing sessions. Duplicate detection by matching session name + first solve timestamp. Toast: Imported N sessions (M duplicates skipped).
- **Export**: Produce the same .txt JSON format as csTimer so users can load exports into csTimer or other compatible tools.
- **Cross-route visibility**: Sessions from timer route visible in stats, imported sessions visible in timer sidebar.

### Settings

- **Sections**: Timer (start delay, scramble lengths per puzzle, inspection toggle/config, sound toggle), Appearance (theme toggle), Data (export/import .txt, clear all sessions), Account (placeholder: Coming soon).
- **Theme**: Carry forward existing dark/light/sticker theme system with localStorage persistence.

### Stats Route

- **Changes to Dashboard**: Minimal — keep existing Dashboard component as-is. Add a session filter/selector (multi-select or dropdown) at the top so users can drill into specific session statistics.

### Future-Proofing

- **Auth**: StorageAdapter interface + Account section in settings. No auth implementation now.
- **Subscription**: Probably advanced stats behind paywall. Do not design subscription features now — just don't block the architecture.

### Puzzle Types

- Supported on day one: 3x3, 2x2, Pyraminx, Square-1.
- Scramble generator architecture supports adding more puzzles later.

## Testing Decisions

- **External behavior only**: Tests should verify observable outcomes (timer starts/stops correctly, scrambles have correct move counts, sessions persist across page reloads, import/export round-trips) not internal state transitions.
- **Existing test infrastructure**: Vitest for unit tests, Playwright for E2E. Follow existing patterns in `tests/unit/` and `tests/e2e/`.
- **Scramble tests**: Verify move count per puzzle type, valid notation tokens, no consecutive same-axis moves (for 3x3/2x2), WCA format compliance where applicable.
- **Session persistence tests**: Verify localStorage round-trip (create session, add solves, reload, assert state matches).
- **Import/export tests**: Round-trip test — export sessions, re-import, assert no data loss. Cross-check against the existing `fixtures/synthetic-export.txt` and `scripts/verify.ts` patterns.
- **Timer tests**: E2E with Playwright — simulate spacebar hold/release, verify time is recorded, verify scramble advances.
- **Prior art**: `tests/unit/parser.test.ts` (parser vs cstimer ground truth), `tests/unit/stats.test.ts` (stats computation), `tests/e2e/dashboard.spec.ts` (upload flow).

## Out of Scope

- WCA-compliant random-state scramble generator for Square-1 (random-move scrambles ship first)
- Timer page layout rework (sidebar as separate component) — defer to follow-up
- Dashboard/Stats page restructuring beyond adding session filter
- Authentication implementation
- Subscription/billing model
- Server-side API routes or database
- Stackmat/timer hardware input
- 4x4, 5x5, 6x6, 7x7, Megaminx, Skewb, Clock scramble generators
- Cloud sync
- Multi-tab session synchronization

## Further Notes

- ADR-0001 (puzzle-type classification precedence) must be respected — the parser's classifySession logic is unchanged by this spec.
- The existing `Solve` type in `src/lib/types.ts` already has `timeMs`, `dnf`, `penalty`, `scramble`, `dateSec`, `splits` — this is sufficient for the timer's solve records. The `penalty` field uses cstimer's convention (0=none, n>0=+2n seconds, -1=DNF).
- The `SessionMeta` type needs extension with `puzzleType: PuzzleType` for the timer's session model (cstimer sessions already carry this via scrType).
- The scramble generator should be a new module — it does not interact with the existing parser or stats modules.
- The `SessionProvider` should handle the existing `cta-theme` localStorage key separately from the new `cstimer-analyzer` key to avoid breaking theme persistence.
