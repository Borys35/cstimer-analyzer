"use client";

import { useState } from "react";
import type { PuzzleType, TimerSolve } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";
import { formatTimerTime } from "@/lib/timer-utils";

const PUZZLE_OPTIONS: PuzzleType[] = ["3x3", "2x2", "Pyraminx", "Square-1"];

export function NewSessionPicker({
  onSelect,
  onClose,
}: {
  onSelect: (puzzle: PuzzleType) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base rounded-lg p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Pick puzzle</h2>
        <div className="grid grid-cols-2 gap-3">
          {PUZZLE_OPTIONS.map((puzzle) => (
            <button
              key={puzzle}
              onClick={() => {
                onSelect(puzzle);
                onClose();
              }}
              className="px-4 py-3 rounded-md bg-surface hover:bg-surface-hover transition-colors text-sm font-medium"
            >
              {puzzle}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SolveList({
  sessionId,
  solves,
  onDeleteSolve,
  onUpdateSolve,
}: {
  sessionId: string;
  solves: TimerSolve[];
  onDeleteSolve: (solveId: string) => void;
  onUpdateSolve: (solveId: string, patch: Partial<Pick<TimerSolve, "penalty" | "dnf">>) => void;
}) {
  if (solves.length === 0) return null;
  const recent = solves.slice(-5).reverse();
  return (
    <div className="mt-1 space-y-0.5" onClick={(e) => e.stopPropagation()}>
      {recent.map((solve, i) => (
        <div key={solve.id} className="flex items-center gap-1 text-[10px]">
          <span className="font-mono opacity-60 w-8 text-right">
            {solve.dnf ? "DNF" : solve.penalty > 0 ? `+${solve.penalty * 2}` : formatTimerTime(solve.timeMs)}
          </span>
          <span className="opacity-30">#{solves.length - (recent.length - 1 - i)}</span>
          <div className="ml-auto flex gap-0.5">
            <button
              onClick={() => onUpdateSolve(solve.id, { penalty: solve.penalty === 1 ? 0 : 1 })}
              className={`px-1 py-0.5 rounded transition-colors ${
                solve.penalty > 0 ? "bg-amber-500/30 text-amber-400" : "bg-surface-hover hover:bg-base"
              }`}
              title="+2 penalty"
            >
              +2
            </button>
            <button
              onClick={() => onUpdateSolve(solve.id, { dnf: !solve.dnf })}
              className={`px-1 py-0.5 rounded transition-colors ${
                solve.dnf ? "bg-red-500/30 text-red-400" : "bg-surface-hover hover:bg-base"
              }`}
              title="DNF"
            >
              DNF
            </button>
            <button
              onClick={() => onDeleteSolve(solve.id)}
              className="px-1 py-0.5 rounded bg-surface-hover hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Delete solve"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SessionSidebar() {
  const {
    sessions,
    activeSession,
    switchSession,
    createSession,
    deleteSession,
    renameSession,
    deleteSolve,
    updateSolve,
  } = useSession();

  const [showPicker, setShowPicker] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      renameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const sidebar = (
    <div className="w-64 h-full bg-surface border-r border-base flex flex-col">
      <div className="p-3 border-b border-base flex items-center justify-between">
        <span className="text-sm font-semibold">Sessions</span>
        <button
          onClick={() => setShowPicker(true)}
          className="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 transition-colors"
        >
          + New Session
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {sessions.map((session) => {
          const isActive = session.id === activeSession?.id;
          return (
            <li
              key={session.id}
              className={`px-3 py-2 border-b border-base cursor-pointer transition-colors ${
                isActive ? "bg-primary/10" : "hover:bg-surface-hover"
              }`}
              onClick={() => switchSession(session.id)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  {renamingId === session.id ? (
                    <input
                      className="w-full text-sm bg-transparent border-b border-primary outline-none"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="text-sm truncate">{session.name}</div>
                  )}
                  <div className="text-xs opacity-50">{session.puzzleType}</div>
                </div>
              </div>

              <div className="flex gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleRename(session.id, session.name)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover hover:bg-base transition-colors"
                >
                  rename
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
                >
                  delete
                </button>
              </div>

              {isActive && (
                <SolveList
                  sessionId={session.id}
                  solves={session.solves}
                  onDeleteSolve={(solveId) => deleteSolve(session.id, solveId)}
                  onUpdateSolve={(solveId, patch) => updateSolve(session.id, solveId, patch)}
                />
              )}
            </li>
          );
        })}
      </ul>

      {showPicker && (
        <NewSessionPicker
          onSelect={(puzzle) => createSession(puzzle)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-40 md:hidden p-2 rounded bg-surface shadow"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sessions"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block h-screen">{sidebar}</div>

      {/* Mobile slide-in */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>
    </>
  );
}
