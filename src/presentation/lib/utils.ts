import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CheatingLogEntry {
  timestamp: string;
  action: string;
  details?: string;
}

/**
 * Agrupa entradas crudas de `cheating_logs` en "incidentes reales".
 *
 * Los 3 listeners de navegador (`fullscreenchange`, `visibilitychange`, `blur`) suelen
 * dispararse casi simultáneamente por UNA sola acción real del alumno (ej. un solo Alt+Tab
 * genera 2-3 eventos con <1s de diferencia). Esta función NO modifica ni descarta el log
 * crudo: solo lo agrupa para fines de visualización, contando como un único incidente toda
 * racha de eventos consecutivos separados por menos de `gapMs` del anterior.
 *
 * Debe usarse el mismo umbral (2000ms) que la deduplicación del backend (`logCheat` en
 * `playground.service.ts`) para que el conteo mostrado sea coherente con lo que el backend
 * ya deduplica en los registros nuevos.
 */
export function groupCheatingIncidents<T extends CheatingLogEntry>(
  logs: T[] | undefined | null,
  gapMs = 2000,
): T[][] {
  if (!logs || logs.length === 0) return [];

  const sorted = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const groups: T[][] = [];
  let currentGroup: T[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevTs = new Date(sorted[i - 1].timestamp).getTime();
    const currTs = new Date(sorted[i].timestamp).getTime();
    if (currTs - prevTs < gapMs) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);

  return groups;
}

/** Devuelve solo el número de incidentes reales (agrupados) a partir del log crudo. */
export function countCheatingIncidents(
  logs: CheatingLogEntry[] | undefined | null,
  gapMs = 2000,
): number {
  return groupCheatingIncidents(logs, gapMs).length;
}
