import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth') // Gắn thẻ Swagger cho nhóm endpoint "auth"
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Đăng ký tài khoản mới',
    description: 'Tạo tài khoản người dùng mới và nhận token JWT',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký thành công',
    schema: {
      example: {
        user: {
          _id: 'user_id',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'user',
          isActive: true,
        },
        access_token: 'jwt_token_here',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email đã tồn tại',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiBody({
    type: SignUpDto,
    description: 'Thông tin đăng ký tài khoản mới',
  })
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập',
    description:
      'Đăng nhập và nhận token JWT để xác thực các request tiếp theo',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập thành công',
    schema: {
      example: {
        access_token: 'your_jwt_token_here',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Thông tin đăng nhập không hợp lệ',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Thông tin đăng nhập',
  })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    return this.authService.login(user);
  }
}
