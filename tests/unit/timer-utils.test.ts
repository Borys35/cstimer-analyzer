import { describe, it, expect } from "vitest";
import { formatTimerTime, formatTypedInput, parseTypedTime } from "@/lib/timer-utils";

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

describe("parseTypedTime", () => {
  it.each([
    ["12.34", 12340],
    ["12.3", 12300],
    ["0.99", 990],
    [".5", 500],
    ["9", 90],
    ["1234", 12340],
    ["105", 1050],
    ["10245", 62450],
    ["1:02.45", 62450],
    ["1:02", 62000],
    [" 12.34 ", 12340],
  ])("parses %s as %i ms", (input, ms) => {
    expect(parseTypedTime(input)).toEqual({ timeMs: ms, dnf: false, penalty: 0 });
  });

  it("parses a trailing + or +2 as a +2 penalty", () => {
    expect(parseTypedTime("12.34+")).toEqual({ timeMs: 12340, dnf: false, penalty: 1 });
    expect(parseTypedTime("1234+2")).toEqual({ timeMs: 12340, dnf: false, penalty: 1 });
  });

  it("parses DNF with and without a time", () => {
    expect(parseTypedTime("DNF")).toEqual({ timeMs: 0, dnf: true, penalty: 0 });
    expect(parseTypedTime("d")).toEqual({ timeMs: 0, dnf: true, penalty: 0 });
    expect(parseTypedTime("dnf(12.34)")).toEqual({ timeMs: 12340, dnf: true, penalty: 0 });
  });

  it.each(["", "abc", "0", "0.00", "1:75.00", "17500", "12..3", "60:00.00", "+"])(
    "rejects %s",
    (input) => {
      expect(parseTypedTime(input)).toBeNull();
    },
  );
});

describe("formatTypedInput", () => {
  it.each([
    ["", ""],
    ["1", "0.01"],
    ["12", "0.12"],
    ["123", "1.23"],
    ["1234", "12.34"],
    ["12345", "1:23.45"],
    ["102450", "10:24.50"],
    ["1024501", "10:24.50"],
    // re-formatting already-masked text after another keystroke or a backspace
    ["12.345", "1:23.45"],
    ["12.3", "1.23"],
    ["0.012", "0.12"],
    // user-typed separators are ignored
    ["12.", "0.12"],
    ["1:2", "0.12"],
  ])("formats %j as %j", (raw, out) => {
    expect(formatTypedInput(raw)).toBe(out);
  });

  it("keeps a trailing + or +2", () => {
    expect(formatTypedInput("12.34+")).toBe("12.34+");
    expect(formatTypedInput("1234+2")).toBe("12.34+2");
    expect(formatTypedInput("1234+5")).toBe("12.34+");
  });

  it("leaves DNF input alone", () => {
    expect(formatTypedInput("dn")).toBe("dn");
    expect(formatTypedInput("DNF(12.34)")).toBe("DNF(12.34)");
  });

  it("produces text that parseTypedTime accepts", () => {
    for (const raw of ["5", "1234", "10245", "1234+"]) {
      expect(parseTypedTime(formatTypedInput(raw))).not.toBeNull();
    }
  });
});
