import { useState, useRef, useCallback } from "react";
import { useSession } from "@/components/SessionProvider";
import { exportCstimer } from "@/lib/import-export";

export function useImportExport() {
  const { sessions, importSessions } = useSession();
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [importSessions],
  );

  const handleExport = useCallback(() => {
    const json = exportCstimer(sessions);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cstimer-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Exported ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`);
  }, [sessions]);

  return {
    toast,
    setToast,
    fileInputRef,
    handleImport,
    handleExport,
  };
}
