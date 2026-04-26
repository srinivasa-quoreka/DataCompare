/**
 * Mapping parser — turns a parsed Excel mapping sheet (already converted to
 * an array-of-rows by SheetJS) into the canonical MappingRow[] used by the
 * validator. Skips DYNAMIC_COLUMN, Dummy_field, and DateTime cells per the
 * legacy parser's rules.
 */
import { MappingRow, SKIPPED_MAPPING_TOKENS } from "./types";
import { resolveFullPath } from "./paths";
import { valuesEqual } from "./normalize";

export interface ParseMappingOptions {
  fieldColumn?: string;
  pathColumn?: string;
  expectedColumn?: string;
  typeColumn?: string;
}

const DEFAULT_COLS: Required<ParseMappingOptions> = {
  fieldColumn: "Field",
  pathColumn: "JSON Path",
  expectedColumn: "Expected",
  typeColumn: "Type",
};

export function parseMappingRows(
  rows: Array<Record<string, unknown>>,
  opts: ParseMappingOptions = {},
): MappingRow[] {
  const o = { ...DEFAULT_COLS, ...opts };
  const out: MappingRow[] = [];

  for (const row of rows) {
    const field = String(row[o.fieldColumn] ?? "").trim();
    const path = String(row[o.pathColumn] ?? "").trim();
    if (!field || !path) continue;
    if (SKIPPED_MAPPING_TOKENS.includes(field as (typeof SKIPPED_MAPPING_TOKENS)[number])) continue;
    if (SKIPPED_MAPPING_TOKENS.includes(path as (typeof SKIPPED_MAPPING_TOKENS)[number])) continue;

    const type = String(row[o.typeColumn] ?? "").trim().toLowerCase();
    if (type === "datetime") continue; // legacy parser skipped DateTime cells

    out.push({
      field,
      jsonPath: path,
      expected: row[o.expectedColumn],
      type: (type || undefined) as MappingRow["type"],
    });
  }

  return out;
}

/**
 * Validate an API response against a parsed mapping.
 * This is the canonical validation path — all three legacy paths
 * (cvApiFromMapping etc.) routed through here.
 */
export function validateAgainstMapping(
  apiResponse: unknown,
  mapping: MappingRow[],
): { passed: boolean; results: Array<{ field: string; jsonPath: string; expected: unknown; actual: unknown; passed: boolean }> } {
  const results = mapping.map((m) => {
    const actual = resolveFullPath(apiResponse, m.jsonPath);
    const passed = valuesEqual(actual, m.expected);
    return {
      field: m.field,
      jsonPath: m.jsonPath,
      expected: m.expected,
      actual,
      passed,
    };
  });
  return { passed: results.every((r) => r.passed), results };
}
