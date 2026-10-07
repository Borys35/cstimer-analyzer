import { useState, useCallback, useEffect, useRef } from "react";
import type { TimerPhase } from "@/lib/timer-utils";
import { generateScramble, generateFallbackScramble } from "@/lib/scramble";
import type { PuzzleType } from "@/lib/types";

export interface UseTimerOptions {
  puzzleType: PuzzleType;
  startDelayMs: number;
  inspectionEnabled?: boolean;
  inspectionDurationSec?: number;
  onSolve: (solve: { timeMs: number; scramble: string; dnf: boolean; penalty: number }) => void;
}

export interface UseTimerReturn {
  phase: TimerPhase;
  displayTime: number;
  scramble: string;
  scrambleIndex: number;
  scrambleTotal: number;
  armedAt: number;
  handleKeyDown: () => void;
  handleKeyUp: () => void;
  handleTap: () => void;
  prevScramble: () => void;
  nextScramble: () => void;
}

export function useTimer({
  puzzleType,
  startDelayMs,
  inspectionEnabled = false,
  inspectionDurationSec = 15,
  onSolve,
}: UseTimerOptions): UseTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [displayTime, setDisplayTime] = useState(0);
  const [scrambleHistory, setScrambleHistory] = useState<string[]>(() => [
    generateFallbackScramble(puzzleType),
  ]);
  const [scrambleIndex, setScrambleIndex] = useState(0);

  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | number>(0);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | number>(0);
  const armedAtRef = useRef(0);
  const inspectionRemainingRef = useRef(0);
  const solveInFlightRef = useRef(false);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    setDisplayTime(elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTiming = useCallback(
    (penalty: number) => {
      cancelAnimationFrame(rafRef.current);
      startTimeRef.current = performance.now();
      setPhase("running");
      rafRef.current = requestAnimationFrame(tick);

      const scrambleRef = scrambleHistory[scrambleIndex];
      const onSolveRef = onSolve;
      const puzzleRef = puzzleType;

      const recordAndReset = () => {
        cancelAnimationFrame(rafRef.current);
        const elapsed = performance.now() - startTimeRef.current;
        const timeMs = Math.round(elapsed);
        setDisplayTime(timeMs);
        setPhase("idle");
        solveInFlightRef.current = false;
        onSolveRef({ timeMs, scramble: scrambleRef, dnf: false, penalty });
        
        generateScramble(puzzleRef)
          .then((newScramble) => {
            setScrambleHistory((prev) => {
              const next = [...prev, newScramble];
              setScrambleIndex(next.length - 1);
              return next;
            });
          })
          .catch(() => {
            const fallback = generateFallbackScramble(puzzleRef);
            setScrambleHistory((prev) => {
              const next = [...prev, fallback];
              setScrambleIndex(next.length - 1);
              return next;
            });
          });
      };

      stopTimingRef.current = recordAndReset;
    },
    [tick, onSolve, scrambleHistory, scrambleIndex, puzzleType],
  );

  const stopTimingRef = useRef<() => void>(() => {});

  const recordSolve = useCallback(
    (dnf: boolean, penalty: number) => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(inspectionIntervalRef.current);
      clearTimeout(delayTimerRef.current);
      setDisplayTime(0);
      setPhase("idle");
      solveInFlightRef.current = false;
      onSolve({ timeMs: 0, scramble: scrambleHistory[scrambleIndex], dnf, penalty });
      
      generateScramble(puzzleType)
        .then((newScramble) => {
          setScrambleHistory((prev) => {
            const next = [...prev, newScramble];
            setScrambleIndex(next.length - 1);
            return next;
          });
        })
        .catch(() => {
          const fallback = generateFallbackScramble(puzzleType);
          setScrambleHistory((prev) => {
            const next = [...prev, fallback];
            setScrambleIndex(next.length - 1);
            return next;
          });
        });
    },
    [onSolve, scrambleHistory, scrambleIndex, puzzleType],
  );

  const handleKeyDown = useCallback(() => {
    if (phase === "idle") {
      setPhase("armed");
      armedAtRef.current = performance.now();
    } else if (phase === "running") {
      stopTimingRef.current();
    }
  }, [phase]);

  const handleKeyUp = useCallback(() => {
    if (phase === "armed") {
      const held = performance.now() - armedAtRef.current;
      if (held < startDelayMs) {
        setPhase("idle");
        return;
      }
      const remaining = Math.max(0, startDelayMs - held);
      solveInFlightRef.current = true;

      if (inspectionEnabled) {
        delayTimerRef.current = setTimeout(() => {
          setPhase("inspection");
          inspectionRemainingRef.current = inspectionDurationSec;
          setDisplayTime(inspectionDurationSec * 1000);

          inspectionIntervalRef.current = setInterval(() => {
            inspectionRemainingRef.current -= 1;
            setDisplayTime(inspectionRemainingRef.current * 1000);
            if (inspectionRemainingRef.current <= 0) {
              clearInterval(inspectionIntervalRef.current);
              recordSolve(true, 0);
            }
          }, 1000);
        }, remaining);
        setPhase("idle");
      } else {
        delayTimerRef.current = setTimeout(startTiming, remaining);
        setPhase("idle");
      }
    }
  }, [phase, startDelayMs, inspectionEnabled, inspectionDurationSec, startTiming, recordSolve]);

  const handleTap = useCallback(() => {
    if (phase === "idle") {
      if (inspectionEnabled) {
        setPhase("inspection");
        inspectionRemainingRef.current = inspectionDurationSec;
        setDisplayTime(inspectionDurationSec * 1000);

        inspectionIntervalRef.current = setInterval(() => {
          inspectionRemainingRef.current -= 1;
          setDisplayTime(inspectionRemainingRef.current * 1000);
          if (inspectionRemainingRef.current <= 0) {
            clearInterval(inspectionIntervalRef.current);
            recordSolve(true, 0);
          }
        }, 1000);
      } else {
        startTiming(0);
      }
    } else if (phase === "inspection") {
      clearInterval(inspectionIntervalRef.current);
      const remaining = inspectionRemainingRef.current;
      const penalty = remaining > 2 ? 2 : 0;
      startTiming(penalty);
    } else if (phase === "running") {
      stopTimingRef.current();
    }
  }, [phase, inspectionEnabled, inspectionDurationSec, startTiming, recordSolve]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(delayTimerRef.current);
      clearInterval(inspectionIntervalRef.current);
    };
  }, []);

  const prevPuzzleRef = useRef(puzzleType);
  useEffect(() => {
    if (prevPuzzleRef.current !== puzzleType) {
      prevPuzzleRef.current = puzzleType;
      const initial = generateFallbackScramble(puzzleType);
      setScrambleHistory([initial]);
      setScrambleIndex(0);
    }

    if (!solveInFlightRef.current && phase !== "armed" && phase !== "inspection") {
      let mounted = true;
      generateScramble(puzzleType)
        .then((newScramble) => {
          if (mounted && newScramble) {
            setScrambleHistory((prev) => {
              if (prev.length <= 1) {
                return [newScramble];
              }
              const next = [...prev];
              next[next.length - 1] = newScramble;
              return next;
            });
          }
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }
  }, [puzzleType, phase]);

  const prevScramble = useCallback(() => {
    setScrambleIndex((i) => Math.max(0, i - 1));
  }, []);

  const nextScramble = useCallback(() => {
    if (scrambleIndex >= scrambleHistory.length - 1) {
      const fallback = generateFallbackScramble(puzzleType);
      setScrambleHistory((prev) => [...prev, fallback]);
      setScrambleIndex((i) => i + 1);
      generateScramble(puzzleType)
        .then((newScramble) => {
          setScrambleHistory((prev) => {
            const next = [...prev];
            next[next.length - 1] = newScramble;
            return next;
          });
        })
        .catch(() => {});
    } else {
      setScrambleIndex((i) => i + 1);
    }
  }, [scrambleIndex, scrambleHistory.length, puzzleType]);

  return {
    phase,
    displayTime,
    scramble: scrambleHistory[scrambleIndex] || generateFallbackScramble(puzzleType),
    scrambleIndex,
    scrambleTotal: scrambleHistory.length,
    armedAt: armedAtRef.current,
    handleKeyDown,
    handleKeyUp,
    handleTap,
    prevScramble,
    nextScramble,
  };
}
