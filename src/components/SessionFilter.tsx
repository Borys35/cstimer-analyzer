"use client";

import type { TimerSession } from "@/lib/types";

interface SessionFilterProps {
  sessions: TimerSession[];
  selectedSessionIds: string[];
  onChange: (ids: string[]) => void;
}

export function SessionFilter({
  sessions,
  selectedSessionIds,
  onChange,
}: SessionFilterProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm opacity-50 py-2">No sessions</div>
    );
  }

  const allIds = sessions.map((s) => s.id);
  const allSelected =
    selectedSessionIds.length === allIds.length ||
    selectedSessionIds.length === 0;

  return (
    <div className="flex flex-wrap gap-2" data-testid="session-filter">
      <button
        onClick={() => onChange(allIds)}
        data-testid="filter-all"
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          allSelected
            ? "bg-primary/20 text-primary font-medium"
            : "bg-surface hover:bg-surface-hover"
        }`}
      >
        All sessions
      </button>
      {sessions.map((session) => {
        const isSelected = selectedSessionIds.includes(session.id);
        return (
          <button
            key={session.id}
            onClick={() => onChange([session.id])}
            data-testid={`filter-${session.id}`}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              isSelected && !allSelected
                ? "bg-primary/20 text-primary font-medium"
                : "bg-surface hover:bg-surface-hover"
            }`}
          >
            {session.name}
            <span className="ml-1.5 text-xs opacity-50">{session.puzzleType}</span>
          </button>
        );
      })}
    </div>
  );
}
