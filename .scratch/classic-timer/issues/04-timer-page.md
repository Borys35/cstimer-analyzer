# 04: Timer Page + Scramble Integration

## What to build

A working timer at `/` (root route) with scramble display, spacebar hold-to-start, touch input, configurable start delay, and automatic time recording to the active session.

## Acceptance criteria

- [ ] Timer page at `/` as a Next.js App Router page (client component)
- [ ] Large centered time display (mm:ss.ms format)
- [ ] Scramble text displayed above the timer
- [ ] Spacebar hold-to-start: hold to arm (ready state), release to start timing, tap to stop
- [ ] Touch tap-to-start/stop for mobile
- [ ] Configurable start delay (0-2s, default 0.5s) — timer arms, waits delay, then starts
- [ ] Post-solve: time recorded to active session via SessionProvider, next scramble auto-generates immediately
- [ ] Penalty buttons (+2, DNF) and delete accessible in session sidebar next to recorded solve
- [ ] No overlays or toasts between solves — fluid csTimer-style flow
- [ ] E2E test: spacebar hold/release records a time, scramble advances

## Blocked by

#02 (Scramble Generator), #03 (SessionProvider).
