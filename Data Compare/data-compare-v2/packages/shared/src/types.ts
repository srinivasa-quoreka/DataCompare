/**
 * Domain types shared across frontend and backend.
 */

export type UserRole = "superadmin" | "admin" | "user";

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * A "Story" is a configured Metal API validation scenario.
 * In the legacy app these were stored in localStorage as a keyed object;
 * here they become first-class DB rows.
 */
export interface Story {
  id: string;
  key: string; // short kebab-case identifier shown as a chip
  title: string;
  description: string | null;
  apiEndpoint: string;
  apiMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  apiHeaders: Record<string, string>;
  apiBody: unknown;
  mappingFileId: string | null;
  expectedFileId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryRun {
  id: string;
  storyId: string;
  status: "pending" | "running" | "passed" | "failed" | "error";
  startedAt: string;
  finishedAt: string | null;
  passedCount: number;
  failedCount: number;
  totalCount: number;
  results: ValidationResult[];
  errorMessage: string | null;
}

export interface ValidationResult {
  field: string;
  jsonPath: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  reason?: string;
}

export interface MappingRow {
  field: string;
  jsonPath: string;
  expected: unknown;
  type?: "string" | "number" | "date" | "boolean" | "ignore";
  notes?: string;
}

/** Cells/fields the legacy parser intentionally skips. */
export const SKIPPED_MAPPING_TOKENS = [
  "DYNAMIC_COLUMN",
  "Dummy_field",
] as const;

export interface ReconciliationJob {
  id: string;
  name: string;
  mode: "row-compare" | "group-sum";
  beforeFileId: string;
  afterFileId: string;
  config: ReconciliationConfig;
  status: "pending" | "running" | "completed" | "failed";
  ownerId: string;
  createdAt: string;
}

export interface ReconciliationConfig {
  matchMethod: "key" | "positional";
  keyColumns?: string[];
  sortColumn?: string;
  columnMappings: Array<{ before: string; after: string; type?: string }>;
  conditions?: Array<{ column: string; op: "eq" | "ne" | "gt" | "lt" | "contains"; value: unknown }>;
  groupBy?: string[];
  sumColumns?: string[];
}

export interface XmlDiffJob {
  id: string;
  name: string;
  beforeFileId: string;
  afterFileId: string;
  status: "pending" | "running" | "completed" | "failed";
  diffSummary: string | null;
  ownerId: string;
  createdAt: string;
}
