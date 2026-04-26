import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { XmlDiffService } from "./xml-diff.service";

class CreateXmlDiffDto {
  @IsString() name!: string;
  @IsString() beforeFileId!: string;
  @IsString() afterFileId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller("xml-diff")
export class XmlDiffController {
  constructor(private readonly svc: XmlDiffService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.svc.list(user.id);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.svc.get(id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateXmlDiffDto) {
    return this.svc.create(user.id, dto);
  }

  @Post(":id/run")
  run(@Param("id") id: string) {
    return this.svc.run(id);
  }
}
