/**
 * Timezone helpers for exam scheduling.
 *
 * All exam times are stored/transmitted as true UTC instants (ISO strings). These
 * helpers let the UI display/interpret them in the exam's OWN configured timezone
 * (`timezone_offset_minutes`) instead of the browser machine's local timezone —
 * per the requirement that time shown must reflect the backend's notion of time,
 * not the client machine's clock/timezone.
 *
 * `offsetMinutes` follows the same convention as `Date.getTimezoneOffset()` in
 * reverse: it's the number of minutes to ADD to UTC to get local wall-clock time
 * (e.g. -300 for UTC-5, since UTC-5 wall time = UTC time - 5h).
 */

/** Default timezone for every exam unless explicitly overridden: UTC-5 (Ecuador). Mirrors backend `timezone.constants.ts`. */
export const DEFAULT_TIMEZONE_OFFSET_MINUTES = -300;

export interface TimezoneOption {
  offsetMinutes: number;
  label: string;
}

/** Curated list of common offsets for the admin exam-scheduling UI. Mirrors backend `TIMEZONE_OPTIONS`. */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { offsetMinutes: -300, label: "UTC-5 (Ecuador, Perú, Colombia)" },
  { offsetMinutes: -360, label: "UTC-6 (México, Centroamérica)" },
  { offsetMinutes: -240, label: "UTC-4 (Bolivia, Venezuela)" },
  { offsetMinutes: -180, label: "UTC-3 (Argentina, Chile, Uruguay, Brasil-E)" },
  { offsetMinutes: 0, label: "UTC+0" },
];

/** Formats a UTC ISO date string as wall-clock time in the given timezone offset (NOT the browser's local timezone). */
export function formatInOffset(
  iso: string | Date | null | undefined,
  offsetMinutes: number = DEFAULT_TIMEZONE_OFFSET_MINUTES,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return "—";
  // Shift the instant by the desired offset, then read it back using UTC getters
  // so the displayed wall-clock time is independent of the browser's own timezone.
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const defaultOpts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  return shifted.toLocaleString("es-EC", { ...defaultOpts, ...opts, timeZone: "UTC" });
}

/** Converts a UTC ISO string into a `datetime-local` input value representing wall time at the given offset. */
export function toOffsetInputValue(
  iso: string | Date | null | undefined,
  offsetMinutes: number = DEFAULT_TIMEZONE_OFFSET_MINUTES
): string {
  if (!iso) return "";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return "";
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}` +
    `T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`
  );
}

/** Converts a `datetime-local` input value (interpreted as wall time at the given offset) back into a UTC ISO string. */
export function fromOffsetInputValue(
  localStr: string,
  offsetMinutes: number = DEFAULT_TIMEZONE_OFFSET_MINUTES
): string {
  if (!localStr) return "";
  // Treat the input as if it were UTC, then subtract the offset to get the true UTC instant.
  const asUtc = new Date(`${localStr}:00.000Z`);
  const trueUtc = new Date(asUtc.getTime() - offsetMinutes * 60_000);
  return trueUtc.toISOString();
}

export function timezoneLabel(offsetMinutes: number | null | undefined): string {
  const found = TIMEZONE_OPTIONS.find((t) => t.offsetMinutes === (offsetMinutes ?? DEFAULT_TIMEZONE_OFFSET_MINUTES));
  return found?.label ?? `UTC${offsetMinutes && offsetMinutes >= 0 ? "+" : ""}${offsetMinutes != null ? offsetMinutes / 60 : -5}`;
}
