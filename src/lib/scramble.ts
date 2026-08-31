import type { PuzzleType } from "@/lib/types";

const FACES_3X3 = ["U", "D", "L", "R", "F", "B"];
const AXES_3X3 = [["U", "D"], ["L", "R"], ["F", "B"]];

const FACES_2X2 = ["U", "R", "F"];
const AXES_2X2 = [["U"], ["R"], ["F"]];

const FACES_PYRAMINX = ["U", "L", "R", "B"];
const TIPS_PYRAMINX = ["u", "l", "r", "b"];

const MODIFIERS = ["", "'", "2"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomMove(face: string): string {
  return face + pick(MODIFIERS);
}

function getAxisIndex(move: string, axes: string[][]): number {
  const face = move.charAt(0);
  return axes.findIndex((group) => group.includes(face));
}

function generateNoRepeats(
  faces: string[],
  axes: string[][],
  length: number,
): string[] {
  const moves: string[] = [];
  let lastAxis = -1;

  for (let i = 0; i < length; i++) {
    let axisIdx: number;
    let face: string;
    do {
      face = pick(faces);
      axisIdx = getAxisIndex(face, axes);
    } while (axisIdx === lastAxis);

    moves.push(randomMove(face));
    lastAxis = axisIdx;
  }

  return moves;
}

function generatePyraminx(length: number): string {
  const axes = FACES_PYRAMINX.map((f) => [f]);
  const mainMoves = generateNoRepeats(FACES_PYRAMINX, axes, length);
  const tips = TIPS_PYRAMINX.map((t) => pick([t, t + "'", t + "2"]));
  return [...mainMoves, ...tips].join(" ");
}

function generateSquare1(length: number): string {
  const slices: string[] = [];
  for (let i = 0; i < length; i++) {
    const top = Math.floor(Math.random() * 12) - 5;
    const bottom = Math.floor(Math.random() * 12) - 5;
    slices.push(`(${top},${bottom}) /`);
  }
  return slices.join(" ").trim();
}

export function generateScramble(
  puzzle: PuzzleType,
  length: number,
): string {
  switch (puzzle) {
    case "3x3":
      return generateNoRepeats(FACES_3X3, AXES_3X3, length).join(" ");
    case "2x2":
      return generateNoRepeats(FACES_2X2, AXES_2X2, length).join(" ");
    case "Pyraminx":
      return generatePyraminx(length);
    case "Square-1":
      return generateSquare1(length);
    default:
      return generateNoRepeats(FACES_3X3, AXES_3X3, length).join(" ");
  }
}
