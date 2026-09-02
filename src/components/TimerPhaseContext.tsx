"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { TimerPhase } from "@/lib/timer-utils";

interface TimerPhaseCtx {
  phase: TimerPhase;
  setPhase: (p: TimerPhase) => void;
}

const TimerPhaseContext = createContext<TimerPhaseCtx>({
  phase: "idle",
  setPhase: () => {},
});

export function TimerPhaseProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  return (
    <TimerPhaseContext.Provider value={{ phase, setPhase }}>
      {children}
    </TimerPhaseContext.Provider>
  );
}

export function useTimerPhase() {
  return useContext(TimerPhaseContext);
}
