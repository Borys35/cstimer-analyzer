"use client";

import { useEffect, useState } from "react";
import type { TimerSession } from "@/lib/types";
import { LocalStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/components/AuthProvider";
import { useSession } from "@/components/SessionProvider";
import { Toast } from "@/components/Toast";

const declinedKey = (userId: string) => `cstimer-analyzer:merge-declined:${userId}`;

/** Changes whenever guest solves are added or removed, so a "no" isn't forever. */
function fingerprint(sessions: TimerSession[]): string {
  const solves = sessions.flatMap((s) => s.solves);
  return `${sessions.length}:${solves.length}:${solves[solves.length - 1]?.id ?? ""}`;
}

interface Candidate {
  sessions: TimerSession[];
  solveCount: number;
  activeId?: string;
  fingerprint: string;
}

/**
 * After sign-in, offers to move sessions recorded while signed out (kept in
 * this browser) into the account. Empty placeholder sessions don't count.
 */
export function LocalMergePrompt() {
  const { user } = useAuth();
  const { hydrated, mergeSessions } = useSession();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !hydrated) return;
    const guest = new LocalStorageAdapter().load();
    const sessions = guest?.sessions.filter((s) => s.solves.length > 0) ?? [];
    if (!sessions.length) return;
    const fp = fingerprint(sessions);
    try {
      if (localStorage.getItem(declinedKey(userId)) === fp) return;
    } catch {}
    setCandidate({
      sessions,
      solveCount: sessions.reduce((n, s) => n + s.solves.length, 0),
      activeId: sessions.some((s) => s.id === guest?.activeSessionId) ? guest?.activeSessionId : undefined,
      fingerprint: fp,
    });
  }, [userId, hydrated]);

  if (!candidate || !userId) {
    return toast ? <Toast message={toast} onClose={() => setToast(null)} duration={4000} /> : null;
  }

  const add = () => {
    mergeSessions(candidate.sessions, candidate.activeId);
    // They live in the account now; leave this browser's guest store empty
    // (settings stay) so signing out doesn't show stale duplicates.
    const guest = new LocalStorageAdapter();
    const data = guest.load();
    if (data) guest.save({ ...data, sessions: [], activeSessionId: "" });
    setCandidate(null);
    setToast(
      `Added ${candidate.sessions.length} session${candidate.sessions.length === 1 ? "" : "s"} to your account`,
    );
  };

  const keepLocal = () => {
    try {
      localStorage.setItem(declinedKey(userId), candidate.fingerprint);
    } catch {}
    setCandidate(null);
  };

  const n = candidate.sessions.length;
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      // Keep Space/keys here from reaching the timer's window listeners.
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-title"
    >
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-6 shadow-2xl w-full max-w-sm">
        <h2 id="merge-title" className="text-lg font-semibold mb-2">
          Add local sessions to your account?
        </h2>
        <p className="text-sm text-[var(--text-dim)] mb-5">
          This browser has{" "}
          <span className="font-mono text-[var(--text)]">{n}</span> session{n === 1 ? "" : "s"} (
          <span className="font-mono text-[var(--text)]">{candidate.solveCount}</span> solve
          {candidate.solveCount === 1 ? "" : "s"}) recorded while you were signed out. Add them to
          your account to see them on all your devices?
        </p>
        <div className="flex flex-col gap-2">
          <button
            autoFocus
            onClick={add}
            className="w-full px-4 py-2 rounded bg-[var(--amber)] text-[var(--bg)] font-medium hover:bg-[var(--amber-dim)] transition-colors"
          >
            Add to my account
          </button>
          <button
            onClick={keepLocal}
            className="w-full px-4 py-2 rounded text-sm text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors"
          >
            Keep them in this browser only
          </button>
        </div>
      </div>
    </div>
  );
}
