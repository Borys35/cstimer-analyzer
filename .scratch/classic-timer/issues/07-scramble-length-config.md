# 07: Scramble Length Config

## What to build

Configurable scramble lengths per puzzle type in settings, with WCA defaults pre-filled. Also adds start delay slider and inspection toggle to settings.

## Acceptance criteria

- [ ] Settings → Timer: scramble length per puzzle (WCA defaults: 3x3=20, 2x2=11, Pyraminx=8, Sq-1=11)
- [ ] Settings → Timer: start delay slider (0-2s, default 0.5s)
- [ ] Settings → Timer: inspection toggle (default off) + duration config (0-15s)
- [ ] Settings values persist via StorageAdapter
- [ ] Timer page respects configured scramble lengths and delay
- [ ] Unit test: scramble length config is respected by generator

## Blocked by

#04 (Timer Page), #06 (Routing).
