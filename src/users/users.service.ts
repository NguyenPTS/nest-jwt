import * as bcrypt from 'bcryptjs'; // Import đúng cách
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // Hàm mã hóa mật khẩu
  getHashPassword(password: string): string {
    const salt = bcrypt.genSaltSync(10); // Tạo salt
    const hash = bcrypt.hashSync(password, salt); // Hash mật khẩu
    return hash;
  }

  // Tạo user mới
  create(createUserDto: CreateUserDto) {
    const hashedPassword = this.getHashPassword(createUserDto.password); // Mã hóa mật khẩu
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return user.save();
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
