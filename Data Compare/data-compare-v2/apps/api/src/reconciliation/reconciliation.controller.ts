import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsIn, IsObject, IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ReconciliationService } from "./reconciliation.service";
import { ReconciliationConfig } from "@data-compare/shared";

class CreateJobDto {
  @IsString() name!: string;
  @IsIn(["row_compare", "group_sum"]) mode!: "row_compare" | "group_sum";
  @IsString() beforeFileId!: string;
  @IsString() afterFileId!: string;
  @IsObject() config!: ReconciliationConfig;
}

@UseGuards(JwtAuthGuard)
@Controller("reconciliation")
export class ReconciliationController {
  constructor(private readonly recon: ReconciliationService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.recon.list(user.id);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.recon.get(id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateJobDto) {
    return this.recon.create(user.id, dto);
  }

  @Post(":id/run")
  run(@Param("id") id: string) {
    return this.recon.run(id);
  }
}
