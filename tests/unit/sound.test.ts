import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { playStartBeep, playStopBeep } from "@/lib/sound";

describe("sound", () => {
  let mockCtx: {
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    destination: object;
    currentTime: number;
  };

  beforeEach(() => {
    mockCtx = {
      createOscillator: vi.fn(() => ({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: "sine",
      })),
      createGain: vi.fn(() => ({
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
      })),
      destination: {},
      currentTime: 0,
    };

    globalThis.AudioContext = vi.fn(function () {
      return mockCtx;
    }) as unknown as typeof AudioContext;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).AudioContext;
    vi.restoreAllMocks();
  });

  describe("playStartBeep", () => {
    it("creates oscillator and gain node", () => {
      playStartBeep();
      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it("connects gain to destination", () => {
      playStartBeep();
      const gainNode = mockCtx.createGain.mock.results[0].value;
      expect(gainNode.connect).toHaveBeenCalledWith(mockCtx.destination);
    });

    it("sets high frequency for start beep", () => {
      playStartBeep();
      const osc = mockCtx.createOscillator.mock.results[0].value;
      expect(osc.frequency.value).toBe(880);
    });
  });

  describe("playStopBeep", () => {
    it("creates oscillator and gain node", () => {
      playStopBeep();
      expect(mockCtx.createOscillator).toHaveBeenCalled();
      expect(mockCtx.createGain).toHaveBeenCalled();
    });

    it("sets lower frequency for stop beep", () => {
      playStopBeep();
      const osc = mockCtx.createOscillator.mock.results[0].value;
      expect(osc.frequency.value).toBe(440);
    });
  });

  describe("graceful fallback", () => {
    it("does not throw when AudioContext is unavailable", () => {
      delete (globalThis as Record<string, unknown>).AudioContext;
      expect(() => playStartBeep()).not.toThrow();
      expect(() => playStopBeep()).not.toThrow();
    });
  });
});
