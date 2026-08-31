# 01: StorageAdapter + Session Types

## What to build

The data foundation for the entire timer feature: TypeScript types for sessions, solves, and settings, a `StorageAdapter` interface for pluggable storage backends, and a `LocalStorageAdapter` implementation using a single `cstimer-analyzer` key in localStorage.

## Acceptance criteria

- [ ] Types defined: `TimerSession`, `TimerSolve`, `TimerSettings`, `AppData`
- [ ] `StorageAdapter` interface with `load()`, `save()`, `deleteSession()`, `updateSession()`, `getActiveSession()`, `setActiveSession()`
- [ ] `LocalStorageAdapter` implementation using single `cstimer-analyzer` key
- [ ] `AppData` shape: `{ sessions: TimerSession[], activeSessionId: string, settings: TimerSettings }`
- [ ] Unit tests: round-trip load/save, session CRUD, active session management

## Blocked by

None (can start immediately).
