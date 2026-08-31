import { describe, it, expect } from "vitest";
import { generateScramble } from "@/lib/scramble";

const AXES_3X3 = [
  ["U", "D"],
  ["L", "R"],
  ["F", "B"],
];

const AXES_2X2 = [
  ["U"],
  ["R"],
  ["F"],
];

function getAxis(move: string, axes: string[][]): number {
  const face = move.charAt(0);
  return axes.findIndex((group) => group.includes(face));
}

function hasConsecutiveSameAxis(scramble: string, axes: string[][]): boolean {
  const moves = scramble.trim().split(/\s+/);
  for (let i = 1; i < moves.length; i++) {
    if (getAxis(moves[i], axes) === getAxis(moves[i - 1], axes)) {
      return true;
    }
  }
  return false;
}

function isValidNotation(move: string): boolean {
  return /^[UDLRFB]('|2)?$/.test(move);
}

function isValid2x2Notation(move: string): boolean {
  return /^[URF]('|2)?$/.test(move);
}

describe("generateScramble", () => {
  describe("3x3", () => {
    it("returns exactly 20 moves", () => {
      const scramble = generateScramble("3x3", 20);
      const moves = scramble.trim().split(/\s+/);
      expect(moves).toHaveLength(20);
    });

    it("uses only valid 3x3 notation", () => {
      const scramble = generateScramble("3x3", 20);
      const moves = scramble.trim().split(/\s+/);
      for (const move of moves) {
        expect(isValidNotation(move)).toBe(true);
      }
    });

    it("has no consecutive same-axis moves", () => {
      const scramble = generateScramble("3x3", 20);
      expect(hasConsecutiveSameAxis(scramble, AXES_3X3)).toBe(false);
    });

    it("produces different scrambles on consecutive calls", () => {
      const s1 = generateScramble("3x3", 20);
      const s2 = generateScramble("3x3", 20);
      expect(s1).not.toBe(s2);
    });
  });

  describe("2x2", () => {
    it("returns exactly 11 moves", () => {
      const scramble = generateScramble("2x2", 11);
      const moves = scramble.trim().split(/\s+/);
      expect(moves).toHaveLength(11);
    });

    it("uses only valid 2x2 notation (U, R, F)", () => {
      const scramble = generateScramble("2x2", 11);
      const moves = scramble.trim().split(/\s+/);
      for (const move of moves) {
        expect(isValid2x2Notation(move)).toBe(true);
      }
    });

    it("has no consecutive same-axis moves", () => {
      const scramble = generateScramble("2x2", 11);
      expect(hasConsecutiveSameAxis(scramble, AXES_2X2)).toBe(false);
    });
  });

  describe("Pyraminx", () => {
    it("returns 8 main moves + 4 tip moves", () => {
      const scramble = generateScramble("Pyraminx", 8);
      const parts = scramble.split(" ");
      const mainMoves = parts.filter((p) => /^[ULRB]('|2)?$/.test(p));
      const tipMoves = parts.filter((p) => /^[ulrb]('|2)?$/.test(p));
      expect(mainMoves).toHaveLength(8);
      expect(tipMoves).toHaveLength(4);
    });

    it("tip moves are independent (no axis constraint)", () => {
      const scramble = generateScramble("Pyraminx", 8);
      const parts = scramble.split(" ");
      const tipMoves = parts.filter((p) => /^[ulrb]('|2)?$/.test(p));
      expect(tipMoves).toHaveLength(4);
    });
  });

  describe("Square-1", () => {
    it("returns scramble in (top,bottom) / format", () => {
      const scramble = generateScramble("Square-1", 11);
      expect(scramble).toMatch(/^\([\d-]+,[\d-]+\) \//);
    });

    it("contains the requested number of slices", () => {
      const scramble = generateScramble("Square-1", 11);
      const slices = scramble.split(" / ");
      expect(slices).toHaveLength(11);
    });
  });

  describe("custom length", () => {
    it("respects custom move count for 3x3", () => {
      const scramble = generateScramble("3x3", 5);
      const moves = scramble.trim().split(/\s+/);
      expect(moves).toHaveLength(5);
    });
  });
});
