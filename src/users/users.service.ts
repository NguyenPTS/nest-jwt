import * as bcrypt from 'bcryptjs';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Hàm mã hóa mật khẩu
  private async hashPassword(password: string): Promise<string> {
    this.logger.debug(`Hashing password: ${password}`);
    const hash = await bcrypt.hash(password, 10);
    this.logger.debug(`Generated hash: ${hash}`);
    return hash;
  }

  // Tạo user mới
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug(`Creating user with email: ${createUserDto.email}`);
    this.logger.debug(`Original password: ${createUserDto.password}`);

    const hashedPassword = await this.hashPassword(createUserDto.password);
    this.logger.debug(`Hashed password: ${hashedPassword}`);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    this.logger.debug(`Saved user: ${JSON.stringify(savedUser)}`);

    return savedUser;
  }

  // Lấy tất cả user
  async findAll(name?: string): Promise<User[]> {
    try {
      this.logger.debug(`Fetching users${name ? ` with name: ${name}` : ''}`);
      const query = name ? { name: { $regex: name, $options: 'i' } } : {};
      const users = await this.userModel.find(query).select('-password').exec();
      this.logger.debug(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  // Lấy user theo ID
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Tìm user theo email
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .lean()
      .exec();
    if (user) {
      this.logger.debug(`Found user by email: ${JSON.stringify(user)}`);
    } else {
      this.logger.debug(`No user found with email: ${email}`);
    }
    return user;
  }

  // Cập nhật user
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, {
        new: true, // Trả về tài liệu đã được cập nhật
      })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Xóa user
  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async findAllWithPagination(page: number = 1, limit: number = 10, name?: string) {
    try {
      this.logger.debug(`Fetching users with pagination: page=${page}, limit=${limit}${name ? `, name=${name}` : ''}`);
      
      // Tạo query với điều kiện tìm kiếm
      const query = name ? { name: { $regex: name, $options: 'i' } } : {};
      
      // Tính toán skip
      const skip = (page - 1) * limit;
      
      // Lấy dữ liệu và tổng số bản ghi
      const [data, total] = await Promise.all([
        this.userModel
          .find(query)
          .select('-password')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.userModel.countDocuments(query).exec()
      ]);

      this.logger.debug(`Found ${data.length} users out of ${total} total`);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }
}
