import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any): Promise<User> {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);
    
    if (!payload || !payload.sub) {
      this.logger.error('Invalid JWT payload: missing sub field');
      throw new UnauthorizedException('Token không hợp lệ');
    }

    try {
      const user = await this.usersService.findById(payload.sub);
      this.logger.debug(`Found user: ${JSON.stringify(user)}`);

      if (!user) {
        this.logger.error(`User not found for sub: ${payload.sub}`);
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      if (!user.isActive) {
        this.logger.error(`User is inactive: ${payload.sub}`);
        throw new UnauthorizedException('Tài khoản đã bị khóa');
      }

      return user;
    } catch (error) {
      this.logger.error(`Error validating JWT: ${error.message}`);
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}
