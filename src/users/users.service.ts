import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { hashSync, genSaltSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from './users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { USER_ROLE } from 'src/databases/sample';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  async checkExistEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    if (user !== null) {
      throw new BadRequestException(
        `Email ${email} đã tồn tại trên hệ thống, vui lòng sử sụng email khác`,
      );
    }
    return true;
  }

  getHashPassword(enterPassword: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(enterPassword, salt);
    return hash;
  }

  matchPassword(enterPassword: string, password: string) {
    return compareSync(enterPassword, password);
  }

  async create(createUserDto: CreateUserDto, user: IUser) {
    const { address, age, company, email, gender, name, password, role } =
      createUserDto;

    const isExist = await this.checkExistEmail(email);
    if (isExist) {
      const newUser = await this.userModel.create({
        address,
        age,
        company,
        email,
        gender,
        name,
        role,
        password: this.getHashPassword(password),
        createdBy: {
          _id: user._id,
          email: user.email,
        },
      });
      return newUser;
    }
  }

  async register(registerUserDto: RegisterUserDto) {
    const { address, age, email, gender, name, password } = registerUserDto;
    const isExisted = await this.checkExistEmail(email);
    if (isExisted) {
      const hashPassword = this.getHashPassword(password);
      const userRole = await this.roleModel.findOne({ name: USER_ROLE });
      const user = await this.userModel.create({
        address,
        age,
        email,
        gender,
        name,
        password: hashPassword,
        role: userRole?._id,
      });
      return user;
    }
  }

  async findAll(qs: string, pageSize: number, current: number) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (current - 1) * pageSize;
    const defaultLimit = pageSize ? pageSize : 10;
    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const users = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(pageSize)
      .sort(sort as any)
      .select(projection)
      .populate(population)
      .select('-password -refreshToken')
      .exec();
    return {
      meta: {
        current: current,
        pageSize: pageSize,
        pages: totalPages,
        total: totalItems,
      },
      result: users,
    };
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findOne({ _id: id })
      .select('-password')
      .populate({ path: 'role', select: { name: 1, _id: 1 } });
    return user;
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    const { _id, address, age, company, email, gender, name, role } =
      updateUserDto;
    const result = await this.userModel.updateOne(
      { _id },
      {
        name,
        address,
        age,
        company,
        email,
        gender,
        role,
        updatedBy: { _id: user._id, email: user.email },
      },
    );
    return result;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const foundUser = await this.userModel.findById(id);
    if (foundUser.email === 'luongtruong20201@gmail.com') {
      throw new BadRequestException('Không thể xóa tài khoản admin');
    }

    const [result] = await Promise.all([
      this.userModel.softDelete({ _id: id }),
      this.userModel.updateOne(
        { _id: id },
        { deletedBy: { _id: user._id, email: user.email } },
      ),
    ]);
    return result;
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .populate({ path: 'role', select: { name: 1 } });
    return user;
  }

  async updateUserToken(id: string, refreshToken: string) {
    await this.userModel.updateOne({ _id: id }, { refreshToken });
  }

  async findUserByToken(refreshToken: string) {
    return await this.userModel.findOne({ refreshToken }).populate({
      path: 'role',
      select: { name: 1 },
    });
  }
}
