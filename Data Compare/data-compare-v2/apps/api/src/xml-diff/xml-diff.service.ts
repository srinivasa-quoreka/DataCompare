import { Injectable } from "@nestjs/common";
import { XMLParser } from "fast-xml-parser";
import * as fs from "node:fs/promises";
import { PrismaService } from "../prisma/prisma.service";

interface XmlDiffEntry {
  path: string;
  before: unknown;
  after: unknown;
  kind: "added" | "removed" | "changed";
}

@Injectable()
export class XmlDiffService {
  private parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.xmlDiffJob.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: { beforeFile: true, afterFile: true },
    });
  }

  get(id: string) {
    return this.prisma.xmlDiffJob.findUniqueOrThrow({
      where: { id },
      include: { beforeFile: true, afterFile: true },
    });
  }

  create(ownerId: string, input: { name: string; beforeFileId: string; afterFileId: string }) {
    return this.prisma.xmlDiffJob.create({ data: { ...input, ownerId } });
  }

  async run(jobId: string) {
    const job = await this.get(jobId);
    await this.prisma.xmlDiffJob.update({ where: { id: jobId }, data: { status: "running" } });
    try {
      const beforeXml = await fs.readFile(job.beforeFile.storedPath, "utf-8");
      const afterXml = await fs.readFile(job.afterFile.storedPath, "utf-8");
      const before = this.parser.parse(beforeXml);
      const after = this.parser.parse(afterXml);
      const diffs = this.diff(before, after);
      const summary = this.buildSummary(diffs);
      return this.prisma.xmlDiffJob.update({
        where: { id: jobId },
        data: { status: "completed", diffPayload: diffs as object, diffSummary: summary },
      });
    } catch (err) {
      return this.prisma.xmlDiffJob.update({
        where: { id: jobId },
        data: { status: "failed", diffSummary: err instanceof Error ? err.message : String(err) },
      });
    }
  }

  /** Recursive object diff producing JSON-pointer-style paths. */
  diff(a: unknown, b: unknown, path = ""): XmlDiffEntry[] {
    const out: XmlDiffEntry[] = [];
    if (a === b) return out;
    if (typeof a !== typeof b || a === null || b === null) {
      out.push({ path: path || "/", before: a ?? null, after: b ?? null, kind: "changed" });
      return out;
    }
    if (typeof a !== "object") {
      out.push({ path, before: a, after: b, kind: "changed" });
      return out;
    }
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
    for (const k of keys) {
      const next = path ? `${path}/${k}` : `/${k}`;
      if (!(k in ao)) { out.push({ path: next, before: undefined, after: bo[k], kind: "added" }); continue; }
      if (!(k in bo)) { out.push({ path: next, before: ao[k], after: undefined, kind: "removed" }); continue; }
      out.push(...this.diff(ao[k], bo[k], next));
    }
    return out;
  }

  /** Plain-text rollup of a diff — counts by kind, sample paths. */
  private buildSummary(diffs: XmlDiffEntry[]): string {
    const byKind = { added: 0, removed: 0, changed: 0 };
    for (const d of diffs) byKind[d.kind]++;
    const samples = diffs.slice(0, 10).map((d) => `${d.kind} ${d.path}`).join("\n");
    return `Added: ${byKind.added}, Removed: ${byKind.removed}, Changed: ${byKind.changed}\n\nSample:\n${samples}`;
  }
}
