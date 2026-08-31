"use client";

import { useState, useMemo } from "react";
import { useSession } from "@/components/SessionProvider";
import { SessionFilter } from "@/components/SessionFilter";
import { formatTimerTime } from "@/lib/timer-utils";
import { rollingAverage } from "@/lib/stats";
import { useImportExport } from "@/lib/use-import-export";
import { Toast } from "@/components/Toast";
import type { TimerSolve } from "@/lib/types";

function toSolve(s: TimerSolve) {
  return {
    timeMs: s.timeMs,
    dnf: s.dnf,
    penalty: s.penalty,
    scramble: s.scramble,
    dateSec: s.dateSec,
    splits: [],
  };
}

function bestTime(solves: TimerSolve[]): number | null {
  const clean = solves.filter((s) => !s.dnf);
  if (clean.length === 0) return null;
  return Math.min(...clean.map((s) => s.timeMs));
}

function computeStats(solves: TimerSolve[]) {
  const total = solves.length;
  const dnfs = solves.filter((s) => s.dnf).length;
  const best = bestTime(solves);
  const ao5 = rollingAverage(solves.map(toSolve), 5);
  const ao12 = rollingAverage(solves.map(toSolve), 12);
  const lastAo5 = ao5.length > 0 ? ao5[ao5.length - 1].ms : null;
  const lastAo12 = ao12.length > 0 ? ao12[ao12.length - 1].ms : null;
  return { total, dnfs, best, lastAo5, lastAo12 };
}

export default function StatsPage() {
  const { sessions } = useSession();
  const allIds = useMemo(() => sessions.map((s) => s.id), [sessions]);
  const [selectedIds, setSelectedIds] = useState<string[]>(allIds);
  const { toast, setToast, fileInputRef, handleImport, handleExport } = useImportExport();

  const filteredSessions = useMemo(
    () => sessions.filter((s) => selectedIds.includes(s.id)),
    [sessions, selectedIds],
  );

  const handleFilterChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stats</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded text-sm bg-primary/20 text-primary hover:bg-primary/30"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={sessions.length === 0}
            className="px-3 py-1 rounded text-sm bg-surface-hover hover:bg-primary/20 disabled:opacity-40"
          >
            Export
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,application/json,text/plain"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      <div className="mb-6">
        <SessionFilter
          sessions={sessions}
          selectedSessionIds={selectedIds}
          onChange={handleFilterChange}
        />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-sm opacity-50 py-8 text-center">
          No sessions to display. Create sessions in the timer to see stats here.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSessions.map((session) => {
            const stats = computeStats(session.solves);
            return (
              <div
                key={session.id}
                className="border border-base rounded-lg p-4 bg-surface"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold">{session.name}</h2>
                    <span className="text-xs opacity-50">{session.puzzleType}</span>
                  </div>
                  <span className="text-xs opacity-40">
                    {new Date(session.createdAt * 1000).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <StatCard label="Solves" value={String(stats.total)} />
                  <StatCard label="DNFs" value={String(stats.dnfs)} />
                  <StatCard
                    label="Best"
                    value={stats.best != null ? formatTimerTime(stats.best) : "-"}
                  />
                  <StatCard
                    label="Ao5"
                    value={stats.lastAo5 != null ? formatTimerTime(stats.lastAo5) : "-"}
                  />
                  <StatCard
                    label="Ao12"
                    value={stats.lastAo12 != null ? formatTimerTime(stats.lastAo12) : "-"}
                  />
                </div>

                {session.solves.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="opacity-50 border-b border-base">
                          <th className="text-left py-1">#</th>
                          <th className="text-right py-1">Time</th>
                          <th className="text-right py-1">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.solves.map((solve, i) => (
                          <tr key={solve.id} className="border-b border-base/50">
                            <td className="py-1 opacity-40">{i + 1}</td>
                            <td className="text-right py-1 font-mono">
                              {solve.dnf
                                ? "DNF"
                                : solve.penalty > 0
                                  ? `+${solve.penalty * 2}`
                                  : formatTimerTime(solve.timeMs)}
                            </td>
                            <td className="text-right py-1 opacity-40">
                              {new Date(solve.dateSec * 1000).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base rounded-md p-2">
      <div className="text-lg font-mono font-bold">{value}</div>
      <div className="text-[10px] opacity-50 uppercase">{label}</div>
    </div>
  );
}
