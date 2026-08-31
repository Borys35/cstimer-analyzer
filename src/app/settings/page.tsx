"use client";

import { useState, useRef } from "react";
import { useSession } from "@/components/SessionProvider";
import { exportCstimer } from "@/lib/import-export";
import { Toast } from "@/components/Toast";
import type { PuzzleType } from "@/lib/types";
import type { Theme } from "@/lib/theme";
import { applyTheme, nextTheme, readStoredTheme, systemTheme } from "@/lib/theme";

const PUZZLE_TYPES: PuzzleType[] = ["3x3", "2x2", "Pyraminx", "Square-1"];

export default function SettingsPage() {
  const { settings, updateSettings, sessions, importSessions, clearAllSessions } = useSession();
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const stored = readStoredTheme();
    return stored === "system" ? systemTheme() : stored;
  });

  const handleScrambleLength = (puzzle: PuzzleType, value: string) => {
    const num = Number(value);
    if (num < 1 || num > 100) return;
    updateSettings({
      scrambleLengths: { ...settings.scrambleLengths, [puzzle]: num },
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const result = importSessions(text);
        setToast(
          `Imported ${result.imported} session${result.imported !== 1 ? "s" : ""}` +
            (result.duplicates > 0
              ? ` (${result.duplicates} duplicate${result.duplicates !== 1 ? "s" : ""} skipped)`
              : ""),
        );
      } catch {
        setToast("Import failed: invalid csTimer export file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const json = exportCstimer(sessions);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cstimer-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Exported ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Timer</h2>
        <div className="space-y-4 bg-surface rounded-lg p-4">
          <SettingRow
            label="Start delay"
            description="Hold duration before timing starts (ms)"
          >
            <input
              type="range"
              min={0}
              max={2000}
              step={100}
              value={settings.startDelayMs}
              aria-label="Start delay"
              onChange={(e) =>
                updateSettings({ startDelayMs: Number(e.target.value) })
              }
              className="w-48"
            />
            <span className="ml-2 text-sm font-mono">{settings.startDelayMs}ms</span>
          </SettingRow>

          <SettingRow
            label="Inspection"
            description="WCA-style 15s inspection before solve"
          >
            <button
              onClick={() =>
                updateSettings({ inspectionEnabled: !settings.inspectionEnabled })
              }
              className={`px-3 py-1 rounded text-sm ${
                settings.inspectionEnabled
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-hover"
              }`}
            >
              {settings.inspectionEnabled ? "On" : "Off"}
            </button>
          </SettingRow>

          {settings.inspectionEnabled && (
            <SettingRow
              label="Inspection duration"
              description="Countdown duration (seconds)"
            >
              <input
                type="range"
                min={0}
                max={15}
                step={1}
                value={settings.inspectionDurationSec}
                aria-label="Inspection duration"
                onChange={(e) =>
                  updateSettings({
                    inspectionDurationSec: Number(e.target.value),
                  })
                }
                className="w-48"
              />
              <span className="ml-2 text-sm font-mono">
                {settings.inspectionDurationSec}s
              </span>
            </SettingRow>
          )}

          <SettingRow
            label="Sound effects"
            description="Play beeps on start/stop"
          >
            <button
              onClick={() =>
                updateSettings({ soundEnabled: !settings.soundEnabled })
              }
              className={`px-3 py-1 rounded text-sm ${
                settings.soundEnabled
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-hover"
              }`}
            >
              {settings.soundEnabled ? "On" : "Off"}
            </button>
          </SettingRow>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Scramble Lengths</h2>
        <div className="space-y-3 bg-surface rounded-lg p-4">
          {PUZZLE_TYPES.map((puzzle) => (
            <SettingRow key={puzzle} label={puzzle} description="Moves per scramble">
              <input
                type="number"
                min={1}
                max={100}
                value={settings.scrambleLengths[puzzle] ?? 20}
                aria-label={`${puzzle} scramble`}
                onChange={(e) => handleScrambleLength(puzzle, e.target.value)}
                className="w-20 text-center text-sm font-mono bg-base rounded px-2 py-1"
              />
            </SettingRow>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Appearance</h2>
        <div className="bg-surface rounded-lg p-4 space-y-3">
          <SettingRow
            label="Theme"
            description="Switch between dark, light, and sticker themes"
          >
            <button
              onClick={() => {
                const next = nextTheme(currentTheme);
                setCurrentTheme(next);
                applyTheme(next);
              }}
              className="px-3 py-1 rounded text-sm bg-surface-hover hover:bg-primary/20 capitalize"
            >
              {currentTheme}
            </button>
          </SettingRow>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Data</h2>
        <div className="bg-surface rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Import csTimer export</div>
              <div className="text-xs opacity-50">
                Merge sessions from a .txt file
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 rounded text-sm bg-primary/20 text-primary hover:bg-primary/30"
            >
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,application/json,text/plain"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Export sessions</div>
              <div className="text-xs opacity-50">
                Download {sessions.length} session{sessions.length !== 1 ? "s" : ""} as csTimer .txt
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={sessions.length === 0}
              className="px-3 py-1 rounded text-sm bg-surface-hover hover:bg-primary/20 disabled:opacity-40"
            >
              Export
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-base">
            <div>
              <div className="text-sm font-medium">Clear all sessions</div>
              <div className="text-xs opacity-50">
                Delete all sessions and start fresh
              </div>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1 rounded text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30"
            >
              Clear all
            </button>
          </div>
        </div>

        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 max-w-sm mx-4 shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
              <p className="text-sm opacity-70 mb-4">
                This will delete all {sessions.length} session{sessions.length !== 1 ? "s" : ""} and cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1 rounded text-sm bg-surface-hover hover:bg-primary/20"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearAllSessions();
                    setShowClearConfirm(false);
                    setToast("All sessions cleared");
                  }}
                  className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600"
                >
                  Yes, clear all
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Account</h2>
        <div className="bg-surface rounded-lg p-4 text-sm opacity-60">
          Coming soon.
        </div>
      </section>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-50">{description}</div>
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
