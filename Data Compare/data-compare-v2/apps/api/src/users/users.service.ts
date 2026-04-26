import { Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(input: { username: string; password: string; email?: string; role: UserRole }) {
    const passwordHash = await bcrypt.hash(input.password, Number(process.env.BCRYPT_ROUNDS ?? 12));
    return this.prisma.user.create({
      data: { username: input.username, email: input.email, role: input.role, passwordHash },
      select: { id: true, username: true, email: true, role: true },
    });
  }

  async resetPassword(userId: string, newPassword: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException();
    const passwordHash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS ?? 12));
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  async setActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, isActive: true },
    });
  }
}
