import { Body, Controller, Post, UseGuards, Req, HttpCode } from "@nestjs/common";
import { IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";

class LoginDto {
  @IsString() username!: string;
  @IsString() @MinLength(1) password!: string;
}

class ChangePasswordDto {
  @IsString() @MinLength(1) oldPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(200)
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me")
  @HttpCode(200)
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
