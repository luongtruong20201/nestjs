import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './schemas/role.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { JobDocument } from 'src/jobs/schemas/job.schema';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { ADMIN_ROLE } from 'src/databases/sample';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: SoftDeleteModel<JobDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const { _id, email } = user;
    const { description, isActive, name, permissions } = createRoleDto;
    const isExist = await this.roleModel.findOne({ name });
    if (isExist) {
      throw new BadRequestException('Name đã tồn tại');
    }
    const data = {
      description,
      isActive,
      permissions,
      name,
      createdBy: { _id, email },
    };

    const result = await this.roleModel.create(data);
    return result;
  }

  async findAll(current: number, pageSize: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    const offset = (current - 1) * pageSize;
    const defaultLimit = pageSize ? pageSize : 10;
    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const roles = await this.roleModel
      .find(filter)
      .sort(sort as any)
      .skip(offset)
      .limit(pageSize)
      .select(projection)
      .populate(population)
      .exec();
    return {
      meta: {
        current: current,
        pageSize: pageSize,
        pages: totalPages,
        total: totalItems,
      },
      result: roles,
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Không tìm thấy role');
    }
    const role = await this.roleModel.findOne({ _id: id }).populate({
      path: 'permissions',
      select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 },
    });
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Không tìm thấy role');
    }
    const { description, isActive, name, permissions } = updateRoleDto;
    const result = await this.roleModel.updateOne(
      { _id: id },
      {
        description,
        isActive,
        name,
        permissions,
        updatedBy: { _id: user._id, email: user.email },
      },
    );
    return result;
  }

  async remove(id: string, user: IUser) {
    const foundRole = await this.roleModel.findById(id);
    if (foundRole.name === ADMIN_ROLE) {
      throw new BadRequestException('Không thể xóa ADMIN');
    }

    const [, result] = await Promise.all([
      this.roleModel.updateOne(
        { _id: id },
        { deletedBy: { _id: user._id, email: user.email } },
      ),
      this.roleModel.softDelete({ _id: id }),
    ]);
    return result;
  }
}
