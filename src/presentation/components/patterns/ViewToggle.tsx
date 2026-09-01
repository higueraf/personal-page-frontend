import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/presentation/lib/utils";

export type ViewMode = "grid" | "list";

/** Recuerda la vista elegida (grid/lista) por pantalla, entre sesiones. */
export function usePersistedViewMode(storageKey: string, defaultMode: ViewMode = "grid") {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return defaultMode;
    const stored = window.localStorage.getItem(storageKey);
    return stored === "grid" || stored === "list" ? stored : defaultMode;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, mode);
  }, [storageKey, mode]);

  return [mode, setMode] as const;
}

/** Par de botones para alternar entre vista de tarjetas (con portada) y vista de lista compacta. */
export default function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Vista de tarjetas"
        aria-pressed={value === "grid"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          value === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <LayoutGrid size={15} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="Vista de lista"
        aria-pressed={value === "list"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          value === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <List size={15} />
      </button>
    </div>
  );
}
