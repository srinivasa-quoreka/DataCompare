import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { UsersService } from "./users.service";

class CreateUserDto {
  @IsString() username!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsIn(["superadmin", "admin", "user"]) role!: "superadmin" | "admin" | "user";
}

class ResetPasswordDto {
  @IsString() @MinLength(8) newPassword!: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles("admin", "superadmin")
  list() {
    return this.users.list();
  }

  @Post()
  @Roles("superadmin")
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(":id/password")
  @Roles("admin", "superadmin")
  resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto) {
    return this.users.resetPassword(id, dto.newPassword);
  }

  @Patch(":id/active")
  @Roles("superadmin")
  setActive(@Param("id") id: string, @Body() body: { isActive: boolean }) {
    return this.users.setActive(id, body.isActive);
  }
}
