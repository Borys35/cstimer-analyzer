// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SessionFilter } from "@/components/SessionFilter";
import type { TimerSession } from "@/lib/types";

function makeSession(overrides: Partial<TimerSession> = {}): TimerSession {
  return {
    id: "s1",
    name: "Session_310826_01",
    puzzleType: "3x3",
    solves: [],
    createdAt: 1725110400,
    endedAt: null,
    ...overrides,
  };
}

describe("SessionFilter", () => {
  const sessions: TimerSession[] = [
    makeSession({ id: "s1", name: "Session_310826_01", puzzleType: "3x3" }),
    makeSession({ id: "s2", name: "Session_310826_02", puzzleType: "2x2" }),
    makeSession({ id: "s3", name: "Session_300826_01", puzzleType: "Pyraminx" }),
  ];

  const defaultProps = {
    sessions,
    selectedSessionIds: [],
    onChange: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders all sessions", () => {
    render(<SessionFilter {...defaultProps} />);
    expect(screen.getAllByText(/Session_310826_01/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Session_310826_02/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Session_300826_01/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders 'All sessions' option", () => {
    render(<SessionFilter {...defaultProps} />);
    expect(screen.getAllByText(/all sessions/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows puzzle type labels next to session names", () => {
    render(<SessionFilter {...defaultProps} />);
    expect(screen.getAllByText("3x3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2x2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pyraminx").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onChange with all session ids when 'All sessions' is selected", () => {
    const onChange = vi.fn();
    render(<SessionFilter {...defaultProps} onChange={onChange} />);
    const allBtn = screen.getAllByText(/all sessions/i)[0].closest("button")!;
    fireEvent.click(allBtn);
    expect(onChange).toHaveBeenCalledWith(["s1", "s2", "s3"]);
  });

  it("calls onChange with single session id when a session is clicked", () => {
    const onChange = vi.fn();
    render(<SessionFilter {...defaultProps} onChange={onChange} />);
    const btn = screen.getAllByText(/Session_310826_01/)[0].closest("button")!;
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith(["s1"]);
  });

  it("highlights selected sessions", () => {
    render(<SessionFilter {...defaultProps} selectedSessionIds={["s1"]} />);
    const btn = screen.getAllByText(/Session_310826_01/)[0].closest("button")!;
    expect(btn.className).toContain("bg-primary");
  });

  it("shows 'All' as active when all sessions are selected", () => {
    render(<SessionFilter {...defaultProps} selectedSessionIds={["s1", "s2", "s3"]} />);
    const allBtn = screen.getAllByText(/all sessions/i)[0].closest("button")!;
    expect(allBtn.className).toContain("bg-primary");
  });

  it("renders empty state when no sessions", () => {
    render(<SessionFilter {...defaultProps} sessions={[]} />);
    expect(screen.getByText(/no sessions/i)).toBeDefined();
  });
});
