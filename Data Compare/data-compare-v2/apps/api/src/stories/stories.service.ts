import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  parseMappingRows,
  validateAgainstMapping,
  MappingRow,
} from "@data-compare/shared";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "node:fs/promises";

export interface RunStoryInput {
  storyId: string;
  userId: string;
}

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.story.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      include: { runs: { take: 1, orderBy: { startedAt: "desc" } } },
    });
  }

  get(id: string) {
    return this.prisma.story.findUniqueOrThrow({
      where: { id },
      include: { mappingFile: true, expectedFile: true },
    });
  }

  create(ownerId: string, input: {
    key: string; title: string; description?: string;
    apiEndpoint: string; apiMethod?: string;
    apiHeaders?: Record<string, string>; apiBody?: unknown;
    mappingFileId?: string; expectedFileId?: string;
  }) {
    return this.prisma.story.create({
      data: {
        ...input,
        apiHeaders: input.apiHeaders ?? {},
        apiBody: input.apiBody ?? undefined,
        ownerId,
      },
    });
  }

  async run({ storyId, userId }: RunStoryInput) {
    const story = await this.get(storyId);
    if (!story.mappingFile) throw new NotFoundException("Story has no mapping file attached");

    const run = await this.prisma.storyRun.create({
      data: { storyId, triggeredById: userId, status: "running" },
    });

    try {
      // 1. Call the configured API
      const res = await fetch(story.apiEndpoint, {
        method: story.apiMethod,
        headers: story.apiHeaders as Record<string, string>,
        body: story.apiBody ? JSON.stringify(story.apiBody) : undefined,
      });
      const apiResponse = await res.json();

      // 2. Parse the mapping spreadsheet
      const mapping = await this.loadMapping(story.mappingFile.storedPath);

      // 3. Validate
      const { passed, results } = validateAgainstMapping(apiResponse, mapping);
      const passedCount = results.filter((r) => r.passed).length;
      const failedCount = results.length - passedCount;

      return this.prisma.storyRun.update({
        where: { id: run.id },
        data: {
          status: passed ? "passed" : "failed",
          finishedAt: new Date(),
          apiResponse,
          results: results as Prisma.InputJsonValue,
          passedCount,
          failedCount,
          totalCount: results.length,
        },
      });
    } catch (err) {
      return this.prisma.storyRun.update({
        where: { id: run.id },
        data: {
          status: "error",
          finishedAt: new Date(),
        },
      });
    }
  }

  private async loadMapping(path: string): Promise<MappingRow[]> {
    const buf = await fs.readFile(path);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]!]!;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return parseMappingRows(rows);
  }
}
