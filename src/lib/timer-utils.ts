export type TimerPhase = "idle" | "armed" | "running" | "inspection";

export function formatTimerTime(ms: number): string {
  if (ms < 60000) {
    const centiseconds = Math.floor(ms / 10);
    const seconds = centiseconds / 100;
    return seconds.toFixed(2);
  }
  const minutes = Math.floor(ms / 60000);
  const remaining = ms % 60000;
  const centiseconds = Math.floor(remaining / 10);
  const seconds = centiseconds / 100;
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
}
