import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard, RolesGuard, JwtRolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtAuthGuard,
    RolesGuard,
    JwtRolesGuard
  ],
  exports: [UsersService]
})
export class UsersModule {}
