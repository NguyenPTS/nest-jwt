import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/schemas/user.schema';
import { ROLES_KEY } from './roles.decorator';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.error(`JWT validation error: ${err?.message || info?.message}`);
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return user;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);

    if (!requiredRoles) {
      this.logger.debug('No roles required, access granted');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    this.logger.debug(`User roles: ${JSON.stringify(user?.role)}`);

    if (!user || !user.role) {
      this.logger.error('User or user role not found');
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    this.logger.debug(`User has required role: ${hasRole}`);

    if (!hasRole) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    return true;
  }
}

@Injectable()
export class JwtRolesGuard implements CanActivate {
  constructor(
    private jwtAuthGuard: JwtAuthGuard,
    private rolesGuard: RolesGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtResult = await this.jwtAuthGuard.canActivate(context);
    if (!jwtResult) {
      return false;
    }

    return this.rolesGuard.canActivate(context);
  }
}
