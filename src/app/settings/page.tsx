"use client";

import { useSession } from "@/components/SessionProvider";

export default function SettingsPage() {
  const { settings, updateSettings } = useSession();

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
              onChange={(e) =>
                updateSettings({ startDelayMs: Number(e.target.value) })
              }
              className="w-48"
            />
            <span className="ml-2 text-sm font-mono">{settings.startDelayMs}ms</span>
          </SettingRow>

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
        <h2 className="text-lg font-semibold mb-3">Data</h2>
        <div className="bg-surface rounded-lg p-4 text-sm opacity-60">
          Import/Export coming in a future update.
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Account</h2>
        <div className="bg-surface rounded-lg p-4 text-sm opacity-60">
          Coming soon.
        </div>
      </section>
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
