// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SettingsPage from "@/app/settings/page";
import { useSession } from "@/components/SessionProvider";

vi.mock("@/components/SessionProvider", () => ({
  useSession: vi.fn(),
}));

function mockSession(overrides: Record<string, unknown> = {}) {
  const defaults = {
    settings: {
      startDelayMs: 500,
      inspectionEnabled: false,
      inspectionDurationSec: 15,
      soundEnabled: false,
      scrambleLengths: { "3x3": 20, "2x2": 11, Pyraminx: 8, "Square-1": 11 },
    },
    sessions: [],
    importSessions: vi.fn(() => ({ imported: 0, duplicates: 0 })),
    updateSettings: vi.fn(),
  };
  return { ...defaults, ...overrides };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SettingsPage", () => {
  it("renders start delay slider with current value", () => {
    const session = mockSession();
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    const slider = screen.getByRole("slider", { name: /start delay/i });
    expect(slider).toBeDefined();
    expect(slider.getAttribute("value")).toBe("500");
  });

  it("calls updateSettings when start delay changes", () => {
    const session = mockSession();
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    const slider = screen.getByRole("slider", { name: /start delay/i });
    fireEvent.change(slider, { target: { value: "1000" } });
    expect(session.updateSettings).toHaveBeenCalledWith({ startDelayMs: 1000 });
  });

  it("renders scramble length inputs for each puzzle type", () => {
    const session = mockSession();
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    expect(screen.getAllByText("3x3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2x2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pyraminx").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Square-1").length).toBeGreaterThanOrEqual(1);
  });

  it("calls updateSettings when a scramble length changes", () => {
    const session = mockSession();
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    const input = screen.getByLabelText(/3x3 scramble/i);
    fireEvent.change(input, { target: { value: "25" } });
    expect(session.updateSettings).toHaveBeenCalledWith({
      scrambleLengths: { "3x3": 25, "2x2": 11, Pyraminx: 8, "Square-1": 11 },
    });
  });

  it("renders inspection toggle as off by default", () => {
    const session = mockSession();
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    const offs = screen.getAllByText("Off");
    expect(offs.length).toBeGreaterThanOrEqual(2);
  });

  it("calls updateSettings when inspection toggle is clicked", () => {
    const session = mockSession();
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    const offs = screen.getAllByText("Off");
    fireEvent.click(offs[0]);
    expect(session.updateSettings).toHaveBeenCalledWith({ inspectionEnabled: true });
  });

  it("shows inspection duration slider when inspection is enabled", () => {
    const session = mockSession({
      settings: {
        startDelayMs: 500,
        inspectionEnabled: true,
        inspectionDurationSec: 10,
        soundEnabled: false,
        scrambleLengths: { "3x3": 20, "2x2": 11, Pyraminx: 8, "Square-1": 11 },
      },
    });
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    expect(screen.getByText("10s")).toBeDefined();
  });

  it("does not show inspection duration slider when inspection is disabled", () => {
    const session = mockSession();
    vi.mocked(useSession).mockReturnValue(session as never);
    render(<SettingsPage />);
    expect(screen.queryByText(/inspection duration/i)).toBeNull();
  });
});
