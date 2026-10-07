import { describe, it, expect } from "vitest";
import { generateScramble, generateFallbackScramble } from "@/lib/scramble";
import type { PuzzleType } from "@/lib/types";

describe("generateScramble", () => {
  it("returns a scramble for 3x3", async () => {
    const scramble = await generateScramble("3x3");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for 2x2", async () => {
    const scramble = await generateScramble("2x2");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for Pyraminx", async () => {
    const scramble = await generateScramble("Pyraminx");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for Square-1", async () => {
    const scramble = await generateScramble("Square-1");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for 4x4", async () => {
    const scramble = await generateScramble("4x4");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for 5x5", async () => {
    const scramble = await generateScramble("5x5");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for Skewb", async () => {
    const scramble = await generateScramble("Skewb");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for Megaminx", async () => {
    const scramble = await generateScramble("Megaminx");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });

  it("returns a scramble for Clock", async () => {
    const scramble = await generateScramble("Clock");
    expect(typeof scramble).toBe("string");
    expect(scramble.length).toBeGreaterThan(0);
  });
});

describe("generateFallbackScramble", () => {
  const puzzles: PuzzleType[] = [
    "2x2",
    "3x3",
    "4x4",
    "5x5",
    "6x6",
    "7x7",
    "Pyraminx",
    "Megaminx",
    "Skewb",
    "Square-1",
    "Clock",
  ];

  puzzles.forEach((puzzle) => {
    it(`generates a valid non-empty fallback scramble for ${puzzle}`, () => {
      const scramble = generateFallbackScramble(puzzle);
      expect(typeof scramble).toBe("string");
      expect(scramble.length).toBeGreaterThan(0);
      expect(scramble).not.toContain("undefined");
    });
  });
});
