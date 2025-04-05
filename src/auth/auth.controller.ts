import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpStatus,
  Get,
  UseGuards,
  Req,
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
import { JwtAuthGuard } from './jwt-auth.guard';
import { Logger } from '@nestjs/common';

@ApiTags('auth') // Gắn thẻ Swagger cho nhóm endpoint "auth"
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

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
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      return this.authService.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy thông tin người dùng',
    description: 'Lấy thông tin người dùng hiện tại bằng JWT token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin thành công',
    schema: {
      example: {
        _id: 'user_id',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'user',
        isActive: true,
        phone: '',
        age: 0,
        address: '',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async getProfile(@Req() req) {
    this.logger.debug(`Request user: ${JSON.stringify(req.user)}`);
    // Trả về thông tin người dùng từ request
    const { password, ...result } = req.user;
    return result;
  }
}
