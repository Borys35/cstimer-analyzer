# 08: Import/Export (csTimer Compatible)

## What to build

Import csTimer `.txt` export files with merge logic and duplicate detection, and export sessions in csTimer's format. Accessible from both timer and stats routes.

## Acceptance criteria

- [ ] Import via file upload (drag-drop + click)
- [ ] Merge logic: duplicate detection by session name + first solve timestamp
- [ ] Toast notification: "Imported N sessions (M duplicates skipped)"
- [ ] Export: produce csTimer `.txt` JSON format
- [ ] Import/export accessible from settings and stats pages
- [ ] Round-trip test: export → re-import → no data loss
- [ ] Existing `src/lib/parser.ts` continues to work for import parsing

## Blocked by

#03 (SessionProvider).
