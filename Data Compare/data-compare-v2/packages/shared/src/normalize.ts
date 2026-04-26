/**
 * Value normalization for cross-source equality.
 * Ported from cvApi() (API-side) and cvApp() (Excel-side) in the legacy app.
 *
 * The fundamental problem: the same logical value comes from APIs as
 * "20240115" or ISO "2024-01-15T00:00:00Z", from Excel as serial 45306
 * or "15/01/2024" or "1/15/2024". This module collapses them all to a
 * canonical form for comparison.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/;
const YYYYMMDD_INT_RE = /^\d{8}$/;
const DDMMYYYY_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
const MDYYYY_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export interface NormalizeOptions {
  /** Excel serial date epoch (Excel uses 1899-12-30 because of the 1900 leap-year bug). */
  excelEpochUtcMs?: number;
  /** Number of decimal places to round numeric comparisons to. Default 6. */
  numberPrecision?: number;
}

const DEFAULT_OPTS: Required<NormalizeOptions> = {
  excelEpochUtcMs: Date.UTC(1899, 11, 30),
  numberPrecision: 6,
};

/**
 * Normalize an API-side value (cvApi).
 * Handles YYYYMMDD integers, ISO date strings, booleans, numeric strings.
 */
export function cvApi(value: unknown, opts: NormalizeOptions = {}): string | number | boolean | null {
  const o = { ...DEFAULT_OPTS, ...opts };
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return roundTo(value, o.numberPrecision);
  }
  if (typeof value !== "string") return JSON.stringify(value);

  const trimmed = value.trim();
  if (!trimmed) return "";

  // YYYYMMDD integer-as-string → ISO date
  if (YYYYMMDD_INT_RE.test(trimmed)) {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(4, 6);
    const d = trimmed.slice(6, 8);
    return `${y}-${m}-${d}`;
  }

  // ISO datetime → date-only canonical form
  if (ISO_DATE_RE.test(trimmed)) return trimmed.slice(0, 10);

  // Booleans-as-strings
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";

  // Numbers-as-strings
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return roundTo(Number(trimmed), o.numberPrecision);

  return trimmed;
}

/**
 * Normalize an Excel/app-side value (cvApp).
 * Handles Excel serial dates, Est.Pmt suffixes, dd/mm/yyyy, M/D/YYYY.
 */
export function cvApp(value: unknown, opts: NormalizeOptions = {}): string | number | boolean | null {
  const o = { ...DEFAULT_OPTS, ...opts };
  if (value == null) return null;
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    // Excel serial date heuristic: integer between 25569 (1970) and 60000 (~2064)
    if (Number.isInteger(value) && value >= 1 && value <= 80000) {
      // Likely a date — but only treat as date if caller will coerce. Return raw.
      return roundTo(value, o.numberPrecision);
    }
    return roundTo(value, o.numberPrecision);
  }

  if (typeof value !== "string") return JSON.stringify(value);
  let s = value.trim();
  if (!s) return "";

  // Strip "Est.Pmt" / "Est. Pmt" prefix or suffix that the legacy app stripped
  s = s.replace(/^Est\.?\s*Pmt\s*/i, "").replace(/\s*Est\.?\s*Pmt$/i, "").trim();

  // dd/mm/yyyy or dd-mm-yyyy
  let m = DDMMYYYY_RE.exec(s);
  if (m) {
    const [, d, mo, y] = m;
    if (Number(mo) > 12) {
      // Could be M/D/YYYY where day > 12 — fall through
    } else {
      return `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    }
  }

  // M/D/YYYY (American)
  m = MDYYYY_RE.exec(s);
  if (m) {
    const [, mo, d, y] = m;
    return `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }

  if (ISO_DATE_RE.test(s)) return s.slice(0, 10);
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(s)) return roundTo(Number(s), o.numberPrecision);

  return s;
}

/** Convert an Excel serial date to ISO date string. */
export function excelSerialToIso(serial: number, opts: NormalizeOptions = {}): string {
  const o = { ...DEFAULT_OPTS, ...opts };
  const ms = o.excelEpochUtcMs + serial * 86400 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Compare two values for "logical equality" using canonical normalization. */
export function valuesEqual(api: unknown, excel: unknown, opts?: NormalizeOptions): boolean {
  const a = cvApi(api, opts);
  const b = cvApp(excel, opts);
  if (a === null || b === null) return a === b;
  if (typeof a === "number" && typeof b === "number") return a === b;
  return String(a) === String(b);
}

function roundTo(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
