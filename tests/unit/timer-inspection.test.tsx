// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "@/lib/use-timer";

function createOpts(overrides: Record<string, unknown> = {}) {
  return {
    puzzleType: "3x3" as const,
    scrambleLength: 20,
    startDelayMs: 0,
    inspectionEnabled: false,
    inspectionDurationSec: 15,
    onSolve: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTimer", () => {
  describe("without inspection", () => {
    it("starts timing on space hold+release", () => {
      const opts = createOpts();
      const { result } = renderHook(() => useTimer(opts));

      act(() => result.current.handleKeyDown());
      expect(result.current.phase).toBe("armed");

      act(() => result.current.handleKeyUp());
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.phase).toBe("running");
    });

    it("stops timing and calls onSolve on second space press", () => {
      const opts = createOpts();
      const { result } = renderHook(() => useTimer(opts));

      act(() => result.current.handleKeyDown());
      act(() => result.current.handleKeyUp());
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.phase).toBe("running");

      act(() => result.current.handleKeyDown());
      expect(result.current.phase).toBe("idle");
      expect(opts.onSolve).toHaveBeenCalledTimes(1);
    });
  });

  describe("with inspection", () => {
    it("enters inspection phase on space hold+release", () => {
      const opts = createOpts({
        inspectionEnabled: true,
        inspectionDurationSec: 15,
      });
      const { result } = renderHook(() => useTimer(opts));

      act(() => result.current.handleKeyDown());
      act(() => result.current.handleKeyUp());
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.phase).toBe("inspection");
    });

    it("starts timing with +2 penalty when tapped early in inspection", () => {
      const opts = createOpts({
        inspectionEnabled: true,
        inspectionDurationSec: 15,
      });
      const { result } = renderHook(() => useTimer(opts));

      act(() => result.current.handleKeyDown());
      act(() => result.current.handleKeyUp());
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.phase).toBe("inspection");

      act(() => result.current.handleTap());
      expect(result.current.phase).toBe("running");

      act(() => result.current.handleKeyDown());
      expect(opts.onSolve).toHaveBeenCalledWith(
        expect.objectContaining({ penalty: 2 }),
      );
    });

    it("starts timing without penalty when tapped in last 2s of inspection", () => {
      const opts = createOpts({
        inspectionEnabled: true,
        inspectionDurationSec: 15,
      });
      const { result } = renderHook(() => useTimer(opts));

      act(() => result.current.handleKeyDown());
      act(() => result.current.handleKeyUp());
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.phase).toBe("inspection");

      act(() => vi.advanceTimersByTime(14000));
      act(() => result.current.handleTap());
      expect(result.current.phase).toBe("running");

      act(() => result.current.handleKeyDown());
      expect(opts.onSolve).toHaveBeenCalledWith(
        expect.objectContaining({ penalty: 0 }),
      );
    });

    it("records DNF when inspection expires without solve", () => {
      const opts = createOpts({
        inspectionEnabled: true,
        inspectionDurationSec: 15,
      });
      const { result } = renderHook(() => useTimer(opts));

      act(() => result.current.handleKeyDown());
      act(() => result.current.handleKeyUp());
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.phase).toBe("inspection");

      act(() => vi.advanceTimersByTime(16000));
      expect(result.current.phase).toBe("idle");
      expect(opts.onSolve).toHaveBeenCalledWith(
        expect.objectContaining({ dnf: true }),
      );
    });
  });
});
