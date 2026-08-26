import { describe, it, expect } from "vitest";
import { classifySession } from "@/lib/parser";
import type { Solve } from "@/lib/types";

function solvesWith(scrambles: string[]): Solve[] {
  return scrambles.map((scramble) => ({
    timeMs: 20000,
    dnf: false,
    penalty: 0,
    scramble,
    dateSec: 1785000000,
    splits: [],
  }));
}

const SQ1 = " (3,0)/ (-2,4)/ (0,-3)/ (5,0)/";
const BIG = "Rw2 Uw Rw2 Fw U2 Rw Uw2";

describe("classifySession precedence", () => {
  it("strong Square-1 signal beats contradicting scrType", () => {
    const r = classifySession(solvesWith([SQ1]), "222so");
    expect(r.puzzleType).toBe("Square-1");
    expect(r.typeSource).toBe("heuristic");
  });

  it("wide moves beat scrType claiming 333", () => {
    const r = classifySession(solvesWith([BIG]), "333");
    expect(r.puzzleType).toBe("4x4");
  });

  it("authoritative scrType wins when scrambles do not contradict", () => {
    const pyr = "U' L' B L R' U B' R L U'";
    const r = classifySession(solvesWith(Array(6).fill(pyr)), "pyrm");
    expect(r.puzzleType).toBe("Pyraminx");
    expect(r.typeSource).toBe("scrType");
  });

  it("stale 2x2 metadata is overridden when scrambles are clearly long", () => {
    const scramble = "R U R' U' F2 D R2 B2 U' F' L D2 R' B U2 L2 F D' R B' L";
    const r = classifySession(solvesWith(Array(8).fill(scramble)), "222so");
    expect(r.puzzleType).toBe("3x3");
    expect(r.typeSource).toBe("heuristic");
  });

  it("consistent short scrambles plus 222so resolve to 2x2 via scrType", () => {
    const twoByTwo = "R U' F2 R2 U2 F' U";
    const r = classifySession(solvesWith(Array(10).fill(twoByTwo)), "222so");
    expect(r.puzzleType).toBe("2x2");
    expect(r.typeSource).toBe("scrType");
  });

  it("empty scrambles fall back to scrType", () => {
    const r = classifySession(solvesWith([]), "sqrs");
    expect(r.puzzleType).toBe("Square-1");
    expect(r.typeSource).toBe("scrType");
  });

  it("no signals at all yields Unknown", () => {
    const r = classifySession([], undefined);
    expect(r.puzzleType).toBe("Unknown");
  });
});
