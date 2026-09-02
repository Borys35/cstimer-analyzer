"use client";

import TimerPage from "@/components/TimerPage";
import { SessionSidebar } from "@/components/SessionSidebar";
import { TimerPhaseProvider, useTimerPhase } from "@/components/TimerPhaseContext";

function TimerLayout() {
  const { phase } = useTimerPhase();
  const collapsed = phase === "armed" || phase === "running";

  return (
    <div className="flex h-full">
      <div
        className={`h-full overflow-hidden transition-all duration-300 ${
          collapsed ? "w-0" : "w-0 md:w-64"
        }`}
      >
        <SessionSidebar />
      </div>
      <div className="flex-1 overflow-hidden">
        <TimerPage />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TimerPhaseProvider>
      <TimerLayout />
    </TimerPhaseProvider>
  );
}
