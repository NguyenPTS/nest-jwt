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
import { User } from 'src/users/schemas/user.schema';
import { SignUpDto } from './dto/signup.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ClsService } from 'nestjs-cls'; // Nếu bạn đang sử dụng thư viện `nestjs-cls`

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly clsService: ClsService, // Inject ClsService
  ) {}

  // Xác thực người dùng
  async validateUser(email: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate user with email: ${email}`);
    this.logger.debug(`Input password: ${password}`);

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.debug(`User not found with email: ${email}`);
      return null;
    }

    this.logger.debug(`User found: ${JSON.stringify(user)}`);
    this.logger.debug(`Stored password hash: ${user.password}`);
    console.log(`Validating password for user: ${user.password}`);
    console.log('Password: ', password);
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    this.logger.debug(`Password validation result: ${isPasswordValid}`);

    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // Tạo token JWT
  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Đăng ký người dùng mới
  async signup(signUpDto: SignUpDto) {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.usersService.findByEmail(signUpDto.email);
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Tạo người dùng mới
    const createUserDto: CreateUserDto = {
      email: signUpDto.email,
      password: signUpDto.password,
      name: signUpDto.name,
      role: 'user',
      isActive: true,
      phone: '',
      age: 0,
      address: '',
    };

    const user = await this.usersService.create(createUserDto);

    // Tạo token JWT
    const token = await this.login(user);
    // Trả về thông tin người dùng và token
    const { password, ...result } = user;
    console.log('result', password);
    return {
      user: result,
      ...token,
    };
  }
  getUser(): User {
    return this.clsService.get(ConstantConfig.REQUEST_ID) as User;
  }
}
