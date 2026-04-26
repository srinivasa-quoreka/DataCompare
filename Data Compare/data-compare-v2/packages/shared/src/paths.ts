/**
 * JSON path resolution helpers.
 * Ported from cvApiFromMapping / resolveFullPath / expandNestedPaths / scanNullObjects
 * in FT_Validator_Standalone.html.
 */

/**
 * Resolve a dotted/bracketed JSON path against an object.
 * Supports: "a.b.c", "a.b[0].c", "a[0][1]", "$.root.x".
 * Returns undefined if any segment is missing.
 */
export function resolveFullPath(obj: unknown, path: string): unknown {
  if (obj == null || !path) return undefined;
  // Strip leading "$." / "$"
  const cleaned = path.replace(/^\$\.?/, "");
  if (!cleaned) return obj;

  const segments: Array<string | number> = [];
  const re = /[^.[\]]+|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    if (m[1] !== undefined) segments.push(Number(m[1]));
    else segments.push(m[0]);
  }

  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur == null) return undefined;
    if (typeof seg === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[seg];
    } else {
      if (typeof cur !== "object") return undefined;
      cur = (cur as Record<string, unknown>)[seg];
    }
  }
  return cur;
}

/**
 * Walk an object/array and produce every fully-resolved leaf path.
 * Used to populate the API field dropdown in the legacy UI.
 */
export function expandNestedPaths(
  obj: unknown,
  prefix = "",
  out: string[] = [],
  maxDepth = 12,
): string[] {
  if (maxDepth <= 0) return out;
  if (obj == null || typeof obj !== "object") {
    if (prefix) out.push(prefix);
    return out;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (prefix) out.push(prefix);
      return out;
    }
    obj.forEach((v, i) => expandNestedPaths(v, `${prefix}[${i}]`, out, maxDepth - 1));
    return out;
  }
  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0) {
    if (prefix) out.push(prefix);
    return out;
  }
  for (const [k, v] of entries) {
    const next = prefix ? `${prefix}.${k}` : k;
    expandNestedPaths(v, next, out, maxDepth - 1);
  }
  return out;
}

/**
 * Scan an object tree for fields that resolved to null/undefined or to an empty object.
 * Useful for surfacing "unmapped" or "missing" fields in the validation UI.
 */
export function scanNullObjects(obj: unknown, prefix = ""): string[] {
  const nulls: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (v == null) {
      nulls.push(path);
      return;
    }
    if (Array.isArray(v)) {
      if (v.length === 0) nulls.push(path);
      else v.forEach((x, i) => walk(x, `${path}[${i}]`));
      return;
    }
    if (typeof v === "object") {
      const entries = Object.entries(v as Record<string, unknown>);
      if (entries.length === 0) {
        nulls.push(path);
        return;
      }
      for (const [k, val] of entries) walk(val, path ? `${path}.${k}` : k);
    }
  };
  walk(obj, prefix);
  return nulls;
}
