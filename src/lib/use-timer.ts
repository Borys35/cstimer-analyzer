import { useState, useCallback, useEffect, useRef } from "react";
import type { TimerPhase } from "@/lib/timer-utils";
import { generateScramble } from "@/lib/scramble";
import type { PuzzleType } from "@/lib/types";

export interface UseTimerOptions {
  puzzleType: PuzzleType;
  scrambleLength: number;
  startDelayMs: number;
  onSolve: (solve: { timeMs: number; scramble: string }) => void;
}

export interface UseTimerReturn {
  phase: TimerPhase;
  displayTime: number;
  scramble: string;
  handleKeyDown: () => void;
  handleKeyUp: () => void;
  handleTap: () => void;
}

export function useTimer({
  puzzleType,
  scrambleLength,
  startDelayMs,
  onSolve,
}: UseTimerOptions): UseTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [displayTime, setDisplayTime] = useState(0);
  const [scramble, setScramble] = useState(() =>
    generateScramble(puzzleType, scrambleLength),
  );

  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const armedAtRef = useRef(0);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    setDisplayTime(elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTiming = useCallback(() => {
    startTimeRef.current = performance.now();
    setPhase("running");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopTiming = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const elapsed = performance.now() - startTimeRef.current;
    const timeMs = Math.round(elapsed);
    setDisplayTime(timeMs);
    setPhase("idle");
    onSolve({ timeMs, scramble });
    setScramble(generateScramble(puzzleType, scrambleLength));
  }, [onSolve, scramble, puzzleType, scrambleLength]);

  const handleKeyDown = useCallback(() => {
    if (phase === "idle") {
      setPhase("armed");
      armedAtRef.current = performance.now();
    } else if (phase === "running") {
      stopTiming();
    }
  }, [phase, stopTiming]);

  const handleKeyUp = useCallback(() => {
    if (phase === "armed") {
      const held = performance.now() - armedAtRef.current;
      const remaining = Math.max(0, startDelayMs - held);
      delayTimerRef.current = setTimeout(startTiming, remaining);
      setPhase("idle");
    }
  }, [phase, startDelayMs, startTiming]);

  const handleTap = useCallback(() => {
    if (phase === "idle") {
      startTiming();
    } else if (phase === "running") {
      stopTiming();
    }
  }, [phase, startTiming, stopTiming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(delayTimerRef.current);
    };
  }, []);

  // Regenerate scramble when puzzle type changes
  useEffect(() => {
    if (phase === "idle") {
      setScramble(generateScramble(puzzleType, scrambleLength));
    }
  }, [puzzleType, scrambleLength, phase]);

  return {
    phase,
    displayTime,
    scramble,
    handleKeyDown,
    handleKeyUp,
    handleTap,
  };
}
