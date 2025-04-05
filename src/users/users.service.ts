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
    const salt = await bcrypt.genSalt(10);
    this.logger.debug(`Generated salt: ${salt}`);
    const hash = await bcrypt.hash(password, salt);
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
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec(); // Trả về danh sách user
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
    const user = await this.userModel.findOne({ email }).select('+password').lean().exec();
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
}
