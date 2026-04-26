import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { cvApp, cvApi, valuesEqual } from "@data-compare/shared";
import * as XLSX from "xlsx";
import * as fs from "node:fs/promises";
import { ReconciliationConfig } from "@data-compare/shared";

interface DiffRow {
  key: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  diffs: Array<{ column: string; before: unknown; after: unknown }>;
  status: "matched" | "before-only" | "after-only" | "diff";
}

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.reconciliationJob.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: { beforeFile: true, afterFile: true },
    });
  }

  get(id: string) {
    return this.prisma.reconciliationJob.findUniqueOrThrow({
      where: { id },
      include: { beforeFile: true, afterFile: true },
    });
  }

  async create(ownerId: string, input: {
    name: string;
    mode: "row_compare" | "group_sum";
    beforeFileId: string;
    afterFileId: string;
    config: ReconciliationConfig;
  }) {
    return this.prisma.reconciliationJob.create({
      data: {
        ...input,
        ownerId,
        config: input.config as object,
      },
    });
  }

  async run(jobId: string) {
    const job = await this.get(jobId);
    await this.prisma.reconciliationJob.update({
      where: { id: jobId },
      data: { status: "running" },
    });

    try {
      const before = await this.readSheet(job.beforeFile.storedPath);
      const after = await this.readSheet(job.afterFile.storedPath);
      const cfg = job.config as unknown as ReconciliationConfig;

      const diff =
        job.mode === "group_sum"
          ? this.groupAndSum(before, after, cfg)
          : this.rowCompare(before, after, cfg);

      return this.prisma.reconciliationJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          finishedAt: new Date(),
          results: diff as unknown as object,
        },
      });
    } catch (err) {
      return this.prisma.reconciliationJob.update({
        where: { id: jobId },
        data: { status: "failed", errorMessage: err instanceof Error ? err.message : String(err) },
      });
    }
  }

  private async readSheet(path: string): Promise<Record<string, unknown>[]> {
    const buf = await fs.readFile(path);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]!]!;
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  }

  /**
   * Row-by-row comparison ("CMP engine"). Matches rows by composite key or by
   * sorted position, then for each matched pair walks the column mapping
   * normalizing both sides via cvApp/cvApi before equality.
   */
  private rowCompare(
    before: Record<string, unknown>[],
    after: Record<string, unknown>[],
    cfg: ReconciliationConfig,
  ): { rows: DiffRow[]; summary: { matched: number; beforeOnly: number; afterOnly: number; diff: number } } {
    const keyFn =
      cfg.matchMethod === "key" && cfg.keyColumns?.length
        ? (r: Record<string, unknown>) => cfg.keyColumns!.map((c) => String(cvApp(r[c]))).join("||")
        : null;

    const beforeMap = new Map<string, Record<string, unknown>>();
    const afterMap = new Map<string, Record<string, unknown>>();

    if (keyFn) {
      before.forEach((r) => beforeMap.set(keyFn(r), r));
      after.forEach((r) => afterMap.set(keyFn(r), r));
    } else {
      const sortKey = cfg.sortColumn;
      const sorter = (a: Record<string, unknown>, b: Record<string, unknown>) => {
        if (!sortKey) return 0;
        return String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      };
      const beforeSorted = [...before].sort(sorter);
      const afterSorted = [...after].sort(sorter);
      const max = Math.max(beforeSorted.length, afterSorted.length);
      for (let i = 0; i < max; i++) {
        if (beforeSorted[i]) beforeMap.set(`pos:${i}`, beforeSorted[i]!);
        if (afterSorted[i]) afterMap.set(`pos:${i}`, afterSorted[i]!);
      }
    }

    const allKeys = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);
    const rows: DiffRow[] = [];
    let matched = 0, beforeOnly = 0, afterOnly = 0, diff = 0;

    for (const key of allKeys) {
      const b = beforeMap.get(key) ?? null;
      const a = afterMap.get(key) ?? null;
      if (!b) { rows.push({ key, before: null, after: a, diffs: [], status: "after-only" }); afterOnly++; continue; }
      if (!a) { rows.push({ key, before: b, after: null, diffs: [], status: "before-only" }); beforeOnly++; continue; }

      const diffs: DiffRow["diffs"] = [];
      for (const m of cfg.columnMappings) {
        const bv = b[m.before];
        const av = a[m.after];
        if (!valuesEqual(av, bv)) diffs.push({ column: m.before, before: bv, after: av });
      }
      if (diffs.length === 0) { rows.push({ key, before: b, after: a, diffs, status: "matched" }); matched++; }
      else { rows.push({ key, before: b, after: a, diffs, status: "diff" }); diff++; }
    }

    return { rows, summary: { matched, beforeOnly, afterOnly, diff } };
  }

  private groupAndSum(
    before: Record<string, unknown>[],
    after: Record<string, unknown>[],
    cfg: ReconciliationConfig,
  ) {
    const group = (rows: Record<string, unknown>[]) => {
      const m = new Map<string, Record<string, number>>();
      for (const r of rows) {
        const key = (cfg.groupBy ?? []).map((c) => String(cvApp(r[c]))).join("||");
        const sums = m.get(key) ?? {};
        for (const c of cfg.sumColumns ?? []) {
          const n = Number(cvApi(r[c]));
          sums[c] = (sums[c] ?? 0) + (Number.isFinite(n) ? n : 0);
        }
        m.set(key, sums);
      }
      return m;
    };
    const b = group(before);
    const a = group(after);
    const keys = new Set([...b.keys(), ...a.keys()]);
    const rows = [...keys].map((k) => ({
      key: k,
      before: b.get(k) ?? null,
      after: a.get(k) ?? null,
    }));
    return { rows, summary: { groups: keys.size } };
  }
}
