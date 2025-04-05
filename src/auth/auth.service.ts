import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { has, omit } from 'lodash';
import { User } from '../users/schemas/user.schema';
import { SignUpDto } from './dto/signup.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Xác thực người dùng
  async validateUser(email: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate user: ${email}`);
    const user = await this.usersService.findByEmail(email);
    this.logger.debug(`User found: ${!!user}`);
    
    if (user) {
      this.logger.debug(`Stored password hash: ${user.password}`);
      const isPasswordValid = await this.usersService.comparePassword(password, user.password);
      this.logger.debug(`Password validation result: ${isPasswordValid}`);
      
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  // Tạo token JWT
  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user._id.toString(), // Convert ObjectId to string
      role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Đăng ký người dùng mới
  async signup(signUpDto: SignUpDto) {
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.usersService.findByEmail(signUpDto.email);
    if (existingUser) {
      throw new UnauthorizedException('Email đã tồn tại');
    }

    // Tạo user mới
    const createUserDto = {
      email: signUpDto.email,
      password: signUpDto.password, // Password sẽ được tự động hash bởi schema
      name: signUpDto.name,
      role: 'user',
      isActive: true,
    };

    const user = await this.usersService.create(createUserDto);
    const { password, ...result } = user;
    
    // Tạo token
    const token = this.jwtService.sign({ 
      email: user.email, 
      sub: user._id.toString(), // Convert ObjectId to string
      role: user.role 
    });

    return {
      user: result,
      access_token: token,
    };
  }

  async getUser(userId: string) {
    this.logger.debug(`Getting user with ID: ${userId}`);
    const user = await this.usersService.findById(userId);
    this.logger.debug(`User found: ${!!user}`);
    
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    const { password, ...result } = user;
    return result;
  }
}
