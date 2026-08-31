# 03: SessionProvider (React Context)

## What to build

A React Context provider that manages all session state across the app. Loads from localStorage on mount, auto-saves on every change, and exposes actions for creating/switching/deleting sessions and adding solves.

## Acceptance criteria

- [ ] `SessionProvider` component wraps the app in `layout.tsx`
- [ ] Loads `AppData` from `LocalStorageAdapter` on mount
- [ ] Auto-saves to localStorage on every state change
- [ ] Exposes via context: sessions, activeSession, settings, addSolve, createSession, endSession, deleteSession, renameSession, updateSettings, switchSession
- [ ] Session naming: `Session_DDMMYY_NN` with daily counter (e.g., `Session_310826_02`)
- [ ] Default 3x3 session created on first load (when no sessions exist)
- [ ] `createSession` accepts puzzle type as parameter
- [ ] Unit tests: provider actions, localStorage persistence, session naming

## Blocked by

#01 (StorageAdapter + Session Types).
