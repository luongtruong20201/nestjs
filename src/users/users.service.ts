import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashSync, genSaltSync, compareSync } from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  getHashPassword(enterPassword: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(enterPassword, salt);
    return hash;
  }

  matchPassword(enterPassword: string, password: string) {
    return compareSync(enterPassword, password);
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userModel.create({
      ...createUserDto,
      password: this.getHashPassword(createUserDto.password),
    });
    return user;
  }

  async findAll() {
    const users = await this.userModel.find();
    return users;
  }

  async findOne(id: string) {
    const user = await this.userModel.findOne({ _id: id });
    return user;
  }

  async update(updateUserDto: UpdateUserDto) {
    await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto },
    );
    return 'Update user successfully';
  }

  async remove(id: string) {
    await this.userModel.deleteOne({ _id: id });
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    return user;
  }
}
