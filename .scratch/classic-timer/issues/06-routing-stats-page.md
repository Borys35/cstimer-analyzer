# 06: Routing + Stats Page

## What to build

Real Next.js App Router routes for `/` (timer), `/stats` (existing Dashboard), and `/settings` (placeholder). The Dashboard on `/stats` gets a session filter so users can drill into specific sessions.

## Acceptance criteria

- [ ] Route `/` = timer page (empty shell initially, timer added in #04)
- [ ] Route `/stats` = existing Dashboard component
- [ ] Route `/settings` = settings page (placeholder content)
- [ ] Dashboard reads sessions from SessionProvider (timer-created sessions appear in stats)
- [ ] Session filter/selector on stats page (multi-select or dropdown) to drill into specific sessions
- [ ] Navigation between routes works (links in header or layout)
- [ ] E2E test: navigate between routes, verify stats shows timer sessions

## Blocked by

#03 (SessionProvider).
