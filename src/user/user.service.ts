import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(userRegisterDto: UserRegisterDto): Promise<User> {
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.userModel.findOne({ email: userRegisterDto.email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(userRegisterDto.password, 10);

    // Tạo user mới
    const user = new this.userModel({
      ...userRegisterDto,
      password: hashedPassword,
    });
    return user.save();
  }

  async login(userLoginDto: UserLoginDto): Promise<User | null> {
    const user = await this.userModel
      .findOne({ email: userLoginDto.email })
      .exec();
    if (user && (await bcrypt.compare(userLoginDto.password, user.password))) {
      return user;//trả về access token
    }
    return null;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
