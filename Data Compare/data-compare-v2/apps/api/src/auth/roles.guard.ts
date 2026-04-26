import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Array<"superadmin" | "admin" | "user">) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest();
    const role = req.user?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException(`Requires role: ${required.join(", ")}`);
    }
    return true;
  }
}
