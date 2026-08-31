import { describe, it, expect } from "vitest";
import {
  importCstimer,
  exportCstimer,
  convertParsedToTimerSession,
} from "@/lib/import-export";
import type { TimerSession, ParsedSession } from "@/lib/types";

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
  return {
    id: "s1",
    name: "Session_310826_01",
    puzzleType: "3x3",
    createdAt: 1725110400,
    endedAt: null,
    solves: [
      {
        id: "solve-1",
        timeMs: 12500,
        dnf: false,
        penalty: 0,
        scramble: "R U R' U'",
        dateSec: 1725110400,
      },
    ],
    ...overrides,
  };
}

const SAMPLE_CSTIMER_EXPORT = JSON.stringify({
  properties: {
    sessionData: JSON.stringify({
      "1": {
        name: "Session 1",
        opt: { scrType: "333" },
        rank: 1,
        stat: [2, 0, 12750],
        date: [1725110400, 1725110500],
      },
    }),
  },
  session1: [
    [[0, 12500], "R U R' U'", "", 1725110400],
    [[0, 13000], "F R U R' U' F'", "", 1725110500],
  ],
});

const SAMPLE_CSTIMER_2X2 = JSON.stringify({
  properties: {
    sessionData: JSON.stringify({
      "1": {
        name: "2x2 Session",
        opt: { scrType: "222so" },
        rank: 1,
        stat: [1, 0, 9490],
        date: [1725110400, 1725110400],
      },
    }),
  },
  session1: [
    [[0, 9490], "D2 B' D2 R2 F' R B2 U2 U L D", "", 1725110400],
  ],
});

describe("import-export", () => {
  describe("convertParsedToTimerSession", () => {
    it("converts a ParsedSession to a TimerSession", () => {
      const parsed: ParsedSession = {
        meta: {
          key: "session1",
          name: "Session 1",
          scrType: "333",
          solveCount: 2,
          firstDateSec: 1725110400,
          lastDateSec: 1725110500,
        },
        solves: [
          {
            timeMs: 12500,
            dnf: false,
            penalty: 0,
            scramble: "R U R' U'",
            dateSec: 1725110400,
            splits: [],
          },
          {
            timeMs: 13000,
            dnf: false,
            penalty: 0,
            scramble: "F R U R' U' F'",
            dateSec: 1725110500,
            splits: [],
          },
        ],
        puzzleType: "3x3",
        typeSource: "scrType",
      };

      const result = convertParsedToTimerSession(parsed);

      expect(result.name).toBe("Session 1");
      expect(result.puzzleType).toBe("3x3");
      expect(result.solves).toHaveLength(2);
      expect(result.solves[0].timeMs).toBe(12500);
      expect(result.solves[0].scramble).toBe("R U R' U'");
      expect(result.solves[0].id).toMatch(/^id-/);
    });

    it("preserves penalty and dnf from parsed solves", () => {
      const parsed: ParsedSession = {
        meta: {
          key: "session1",
          name: "Test",
          solveCount: 2,
          firstDateSec: 1725110400,
          lastDateSec: 1725110400,
        },
        solves: [
          {
            timeMs: 14500,
            dnf: false,
            penalty: 2000,
            scramble: "R",
            dateSec: 1725110400,
            splits: [],
          },
          {
            timeMs: 12000,
            dnf: true,
            penalty: -1,
            scramble: "U",
            dateSec: 1725110400,
            splits: [],
          },
        ],
        puzzleType: "3x3",
        typeSource: "heuristic",
      };

      const result = convertParsedToTimerSession(parsed);
      expect(result.solves[0].penalty).toBe(2000);
      expect(result.solves[1].dnf).toBe(true);
      expect(result.solves[1].penalty).toBe(-1);
    });
  });

  describe("importCstimer", () => {
    it("imports sessions from csTimer export", () => {
      const result = importCstimer(SAMPLE_CSTIMER_EXPORT, []);

      expect(result.imported).toHaveLength(1);
      expect(result.imported[0].name).toBe("Session 1");
      expect(result.imported[0].solves).toHaveLength(2);
      expect(result.duplicates).toBe(0);
    });

    it("detects duplicates by name + first solve timestamp", () => {
      const existing: TimerSession[] = [
        makeSession({
          id: "existing",
          name: "Session 1",
          createdAt: 1725110400,
          solves: [
            {
              id: "s1",
              timeMs: 12500,
              dnf: false,
              penalty: 0,
              scramble: "R",
              dateSec: 1725110400,
            },
          ],
        }),
      ];

      const result = importCstimer(SAMPLE_CSTIMER_EXPORT, existing);

      expect(result.imported).toHaveLength(0);
      expect(result.duplicates).toBe(1);
    });

    it("imports non-duplicate sessions and skips duplicates", () => {
      const existing: TimerSession[] = [
        makeSession({
          id: "existing",
          name: "Session 1",
          createdAt: 1725110400,
          solves: [
            {
              id: "s1",
              timeMs: 12500,
              dnf: false,
              penalty: 0,
              scramble: "R",
              dateSec: 1725110400,
            },
          ],
        }),
      ];

      const export2 = JSON.stringify({
        properties: {
          sessionData: JSON.stringify({
            "1": {
              name: "Session 1",
              opt: { scrType: "333" },
              rank: 1,
              stat: [2, 0, 12750],
              date: [1725110400, 1725110500],
            },
            "2": {
              name: "New Session",
              opt: { scrType: "222so" },
              rank: 2,
              stat: [1, 0, 9490],
              date: [1725200000, 1725200000],
            },
          }),
        },
        session1: [
          [[0, 12500], "R U R' U'", "", 1725110400],
        ],
        session2: [
          [[0, 9490], "D2 B' D2 R2 F' R B2 U2 U L D", "", 1725200000],
        ],
      });

      const result = importCstimer(export2, existing);

      expect(result.imported).toHaveLength(1);
      expect(result.imported[0].name).toBe("New Session");
      expect(result.duplicates).toBe(1);
    });

    it("handles invalid JSON gracefully", () => {
      expect(() => importCstimer("not json", [])).toThrow();
    });

    it("handles empty export", () => {
      const result = importCstimer(JSON.stringify({ properties: {} }), []);
      expect(result.imported).toHaveLength(0);
      expect(result.duplicates).toBe(0);
    });
  });

  describe("exportCstimer", () => {
    it("exports sessions in csTimer format", () => {
      const sessions: TimerSession[] = [
        makeSession({
          name: "Exported Session",
          puzzleType: "3x3",
          solves: [
            {
              id: "e1",
              timeMs: 12500,
              dnf: false,
              penalty: 0,
              scramble: "R U R' U'",
              dateSec: 1725110400,
            },
          ],
        }),
      ];

      const json = exportCstimer(sessions);
      const parsed = JSON.parse(json);

      expect(parsed.properties).toBeDefined();
      expect(parsed.session1).toBeDefined();
      expect(parsed.session1).toHaveLength(1);
    });

    it("exports penalty correctly", () => {
      const sessions: TimerSession[] = [
        makeSession({
          name: "Penalty Session",
          solves: [
            {
              id: "p1",
              timeMs: 14500,
              dnf: false,
              penalty: 2000,
              scramble: "R",
              dateSec: 1725110400,
            },
            {
              id: "p2",
              timeMs: 12000,
              dnf: true,
              penalty: -1,
              scramble: "U",
              dateSec: 1725110400,
            },
          ],
        }),
      ];

      const json = exportCstimer(sessions);
      const parsed = JSON.parse(json);

      expect(parsed.session1[0][0][0]).toBe(2000);
      expect(parsed.session1[1][0][0]).toBe(-1);
    });

    it("exports multiple sessions", () => {
      const sessions: TimerSession[] = [
        makeSession({ id: "s1", name: "Session A" }),
        makeSession({
          id: "s2",
          name: "Session B",
          puzzleType: "2x2",
          solves: [
            {
              id: "s3",
              timeMs: 9490,
              dnf: false,
              penalty: 0,
              scramble: "D2 B' D2",
              dateSec: 1725200000,
            },
          ],
        }),
      ];

      const json = exportCstimer(sessions);
      const parsed = JSON.parse(json);

      expect(parsed.session1).toBeDefined();
      expect(parsed.session2).toBeDefined();
    });
  });

  describe("round-trip", () => {
    it("export → re-import preserves solve data", () => {
      const original: TimerSession[] = [
        makeSession({
          name: "Round Trip",
          puzzleType: "3x3",
          solves: [
            {
              id: "rt1",
              timeMs: 12500,
              dnf: false,
              penalty: 0,
              scramble: "R U R' U'",
              dateSec: 1725110400,
            },
            {
              id: "rt2",
              timeMs: 14500,
              dnf: false,
              penalty: 2000,
              scramble: "F R U",
              dateSec: 1725110500,
            },
            {
              id: "rt3",
              timeMs: 12000,
              dnf: true,
              penalty: -1,
              scramble: "U F R",
              dateSec: 1725110600,
            },
          ],
        }),
      ];

      const json = exportCstimer(original);
      const result = importCstimer(json, []);

      expect(result.imported).toHaveLength(1);
      const roundTripped = result.imported[0];
      expect(roundTripped.name).toBe("Round Trip");
      expect(roundTripped.solves).toHaveLength(3);
      expect(roundTripped.solves[0].timeMs).toBe(12500);
      expect(roundTripped.solves[0].penalty).toBe(0);
      expect(roundTripped.solves[0].dnf).toBe(false);
      expect(roundTripped.solves[1].penalty).toBe(2000);
      expect(roundTripped.solves[2].dnf).toBe(true);
    });
  });
});
