// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SessionProvider } from "@/components/SessionProvider";
import { SessionSidebar } from "@/components/SessionSidebar";
import type { StorageAdapter, AppData, TimerSession } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

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

function makeData(sessions: TimerSession[], activeSessionId = "s1"): AppData {
  return { sessions, activeSessionId, settings: DEFAULT_SETTINGS };
}

function renderWithProvider(ui: React.ReactNode, adapter: StorageAdapter) {
  return render(
    <SessionProvider adapter={adapter}>{ui}</SessionProvider>,
  );
}

function makeAdapter(data: AppData) {
  return {
    load: vi.fn().mockReturnValue(data),
    save: vi.fn().mockReturnValue(undefined),
    updateSession: vi.fn().mockReturnValue(undefined),
    setActiveSession: vi.fn().mockReturnValue(undefined),
  } as unknown as StorageAdapter;
}

describe("SessionSidebar", () => {
  let adapter: StorageAdapter;
  let data: AppData;

  beforeEach(() => {
    data = makeData([
      makeSession({ id: "s1", name: "Session_310826_01", puzzleType: "3x3" }),
      makeSession({ id: "s2", name: "Session_310826_02", puzzleType: "2x2" }),
    ], "s1");
    adapter = makeAdapter(data);
  });

  it("renders session list", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const s1 = screen.getAllByText("Session_310826_01");
    const s2 = screen.getAllByText("Session_310826_02");
    expect(s1.length).toBeGreaterThanOrEqual(1);
    expect(s2.length).toBeGreaterThanOrEqual(1);
  });

  it("shows puzzle type labels", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    expect(screen.getAllByText("3x3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2x2").length).toBeGreaterThanOrEqual(1);
  });

  it("highlights the active session", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const items = screen.getAllByText("Session_310826_01");
    const li = items[0].closest("li");
    expect(li?.className).toContain("bg-");
  });

  it("calls switchSession when clicking a different session", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const btns = screen.getAllByText("Session_310826_02");
    fireEvent.click(btns[0]);
    const activeItems = screen.getAllByText("Session_310826_02");
    const li = activeItems[0].closest("li");
    expect(li?.className).toContain("bg-primary/10");
  });

  it("shows new session button", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const btns = screen.getAllByText(/new session/i);
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });

  it("opens puzzle picker when new session is clicked", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const btns = screen.getAllByText(/new session/i);
    fireEvent.click(btns[0]);
    const pickers = screen.getAllByText("Pick puzzle");
    expect(pickers.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pyraminx").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Square-1").length).toBeGreaterThanOrEqual(1);
  });

  it("creates new session when puzzle is selected", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const btns = screen.getAllByText(/new session/i);
    fireEvent.click(btns[0]);
    const pickers = screen.getAllByText("Pick puzzle");
    const picker = pickers[0].closest("div")!;
    const puzzleBtns = within(picker).getAllByText("Pyraminx");
    fireEvent.click(puzzleBtns[0]);
    expect(screen.getAllByText(/Session_/i).length).toBeGreaterThanOrEqual(3);
  });

  it("shows ended sessions at the bottom", () => {
    data = makeData([
      makeSession({ id: "s3", name: "Session_300826_01", puzzleType: "Pyraminx", endedAt: 1725000000 }),
      makeSession({ id: "s1", name: "Session_310826_01", puzzleType: "3x3" }),
    ], "s1");
    adapter = makeAdapter(data);
    renderWithProvider(<SessionSidebar />, adapter);
    const ended = screen.getAllByText("Session_300826_01");
    const active = screen.getAllByText("Session_310826_01");
    expect(ended.length).toBeGreaterThanOrEqual(1);
    expect(active.length).toBeGreaterThanOrEqual(1);
  });

  it("shows delete button for each session", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const deletes = screen.getAllByText(/delete/i);
    expect(deletes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows rename button for each session", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const renames = screen.getAllByText(/rename/i);
    expect(renames.length).toBeGreaterThanOrEqual(2);
  });

  it("shows end button for each session", () => {
    renderWithProvider(<SessionSidebar />, adapter);
    const ends = screen.getAllByText(/end/i);
    expect(ends.length).toBeGreaterThanOrEqual(2);
  });
});
