import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true }) // Thêm timestamps để tự động cập nhật createdAt và updatedAt
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: UserRole.USER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: 0 })
  age: number;

  @Prop({ default: '' })
  address: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
