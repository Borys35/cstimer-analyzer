import { describe, it, expect } from "vitest";
import { formatTimerTime } from "@/lib/timer-utils";

describe("formatTimerTime", () => {
  it("formats sub-minute as seconds with two decimals", () => {
    expect(formatTimerTime(12345)).toBe("12.34");
  });

  it("formats exactly 10 seconds", () => {
    expect(formatTimerTime(10000)).toBe("10.00");
  });

  it("formats sub-second", () => {
    expect(formatTimerTime(999)).toBe("0.99");
  });

  it("formats minutes with padded seconds", () => {
    expect(formatTimerTime(75400)).toBe("1:15.40");
  });

  it("formats exactly 1 minute", () => {
    expect(formatTimerTime(60000)).toBe("1:00.00");
  });

  it("formats multi-minute", () => {
    expect(formatTimerTime(180000)).toBe("3:00.00");
  });

  it("formats 0 as 0.00", () => {
    expect(formatTimerTime(0)).toBe("0.00");
  });
});
