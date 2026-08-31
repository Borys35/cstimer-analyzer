# 05: Session Sidebar

## What to build

A csTimer-style left sidebar with session list, session creation with puzzle picker, and inline session management actions. Selecting a past session makes it the active session.

## Acceptance criteria

- [ ] Left sidebar with session list, active session highlighted
- [ ] Each session shows its puzzle type label
- [ ] "New Session" button opens a puzzle picker: default 3x3, options are 2x2, Pyraminx, Square-1
- [ ] Puzzle type is immutable once session is created
- [ ] Inline actions per session: end session, rename, delete
- [ ] Selecting a past session makes it active — timer uses that session's puzzle type for scrambles
- [ ] Collapses to hamburger icon on mobile (slide-in panel)
- [ ] E2E test: create 2x2 session, verify scrambles are 2x2, switch to 3x3 session, verify scrambles are 3x3

## Blocked by

#03 (SessionProvider), #04 (Timer Page).
