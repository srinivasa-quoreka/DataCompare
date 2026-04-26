import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsObject, IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { StoriesService } from "./stories.service";

class CreateStoryDto {
  @IsString() key!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() apiEndpoint!: string;
  @IsOptional() @IsString() apiMethod?: string;
  @IsOptional() @IsObject() apiHeaders?: Record<string, string>;
  @IsOptional() apiBody?: unknown;
  @IsOptional() @IsString() mappingFileId?: string;
  @IsOptional() @IsString() expectedFileId?: string;
}

@UseGuards(JwtAuthGuard)
@Controller("stories")
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.stories.list(user.id);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.stories.get(id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateStoryDto) {
    return this.stories.create(user.id, dto);
  }

  @Post(":id/run")
  run(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.stories.run({ storyId: id, userId: user.id });
  }
}
