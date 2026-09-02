"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useTimer } from "@/lib/use-timer";
import { formatTimerTime } from "@/lib/timer-utils";
import { playStartBeep, playStopBeep } from "@/lib/sound";
import { useMenu } from "@/components/MenuContext";
import { useTimerPhase } from "@/components/TimerPhaseContext";

export default function TimerPage() {
  const { activeSession, settings, addSolve } = useSession();
  const { mobileOpen, setMobileOpen } = useMenu();
  const { setPhase: publishPhase } = useTimerPhase();

  const puzzleType = activeSession?.puzzleType ?? "3x3";
  const scrambleLength =
    settings.scrambleLengths[puzzleType] ?? 20;

  const solve = useCallback(
    (data: { timeMs: number; scramble: string; dnf: boolean; penalty: number }) => {
      addSolve({
        timeMs: data.timeMs,
        dnf: data.dnf,
        penalty: data.penalty,
        scramble: data.scramble,
        dateSec: Math.floor(Date.now() / 1000),
      });
    },
    [addSolve],
  );

  const {
    phase,
    displayTime,
    scramble,
    armedAt,
    handleKeyDown,
    handleKeyUp,
    handleTap,
  } = useTimer({
    puzzleType,
    scrambleLength,
    startDelayMs: settings.startDelayMs,
    inspectionEnabled: settings.inspectionEnabled,
    inspectionDurationSec: settings.inspectionDurationSec,
    onSolve: solve,
  });

  useEffect(() => {
    publishPhase(phase);
  }, [phase, publishPhase]);

  const handleKeyDownEvent = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (phase === "running") {
        e.preventDefault();
        handleKeyDown();
      } else if (e.code === "Space") {
        e.preventDefault();
        handleKeyDown();
      }
    },
    [phase, handleKeyDown],
  );

  const handleKeyUpEvent = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleKeyUp();
      }
    },
    [handleKeyUp],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDownEvent);
    window.addEventListener("keyup", handleKeyUpEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDownEvent);
      window.removeEventListener("keyup", handleKeyUpEvent);
    };
  }, [handleKeyDownEvent, handleKeyUpEvent]);

  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (!settings.soundEnabled) {
      prevPhaseRef.current = phase;
      return;
    }

    const prev = prevPhaseRef.current;
    if (prev !== "running" && phase === "running") {
      playStartBeep();
    } else if (prev === "running" && phase === "idle") {
      playStopBeep();
    }
    prevPhaseRef.current = phase;
  }, [phase, settings.soundEnabled]);

  const phaseLabel =
    phase === "armed"
      ? "Ready..."
      : phase === "running"
        ? "Solving..."
        : phase === "inspection"
          ? "Inspecting..."
          : "Press spacebar to start";

  const [holdMs, setHoldMs] = useState(0);
  useEffect(() => {
    if (phase !== "armed") {
      setHoldMs(0);
      return;
    }
    const id = setInterval(() => {
      setHoldMs(performance.now() - armedAt);
    }, 30);
    return () => clearInterval(id);
  }, [phase, armedAt]);

  const timerColor =
    phase === "armed"
      ? holdMs >= settings.startDelayMs
        ? "var(--green)"
        : "var(--red)"
      : "var(--text)";

  const showBlind = settings.hideTimer && phase === "running";
  const isActive = phase === "armed" || phase === "running";

  return (
    <div
      className="flex flex-col items-center justify-center h-full select-none relative px-12"
      onTouchStart={handleKeyDown}
      onTouchEnd={handleKeyUp}
    >
      <button
        className={`absolute top-3 left-3 z-40 md:hidden p-2 rounded bg-[var(--surface-3)] hover:bg-[var(--surface-2)] transition-colors ${isActive ? "opacity-30 pointer-events-none" : ""}`}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sessions"
        disabled={isActive}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="text-[36px] font-medium opacity-70 mb-8 max-w-9xl text-center whitespace-pre-wrap leading-snug tracking-[0.15em]">
        {scramble}
      </div>

      <div
        className="text-9xl font-mono font-bold tracking-tight cursor-pointer transition-colors"
        style={{ color: timerColor }}
        data-testid="timer-display"
      >
        {showBlind ? "Solving..." : formatTimerTime(displayTime)}
      </div>

      <div className="text-xl opacity-40 mt-4">{phaseLabel}</div>

      <div className="mt-8 text-base opacity-30">
        {puzzleType} &middot; {activeSession?.name ?? "No session"}
      </div>
    </div>
  );
}
