import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { JwtRolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { AuthService } from '../auth/auth.service';
import { Logger } from '@nestjs/common';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtRolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @ApiResponse({
    status: 201,
    description: 'Người dùng đã được tạo thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả người dùng (có phân trang và lọc theo tên)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Số trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng bản ghi mỗi trang (mặc định: 10)',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Tên người dùng để lọc (không phân biệt hoa thường)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng (có phân trang và lọc theo tên).',
    schema: {
      example: {
        total: 100,
        page: 1,
        limit: 10,
        data: [
          {
            _id: 'user_id_1',
            email: 'user1@example.com',
            name: 'John Doe',
            role: 'user',
            isActive: true,
          },
          {
            _id: 'user_id_2',
            email: 'user2@example.com',
            name: 'Jane Doe',
            role: 'admin',
            isActive: true,
          },
        ],
      },
    },
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('name') name?: string,
  ) {
    try {
      this.logger.debug(
        `Fetching users with pagination: page=${page}, limit=${limit}, name=${name}`,
      );
      const users = await this.usersService.findAllWithPagination(
        page,
        limit,
        name,
      );
      return {
        statusCode: 200,
        message: 'Danh sách người dùng.',
        data: users,
      };
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy thông tin người dùng',
    description: 'Lấy thông tin người dùng hiện tại bằng JWT token',
  })
  @ApiResponse({
    status: 200,
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
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async getProfile(@Req() req) {
    this.logger.debug(`Request user: ${JSON.stringify(req.user)}`);
    return this.authService.getUser(req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID (Chỉ admin)' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng.',
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
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng.' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng' })
  @ApiResponse({ status: 200, description: 'Xóa thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng.' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return {
      statusCode: 200,
      message: 'Xóa thành công.',
    };
  }

  @Get('check-admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Kiểm tra role admin của người dùng' })
  @ApiParam({ name: 'id', description: 'ID của người dùng cần kiểm tra' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra role admin',
    schema: {
      example: {
        isAdmin: true,
        user: {
          _id: 'user_id',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng.' })
  async checkAdmin(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      isAdmin: user.role === UserRole.ADMIN,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
