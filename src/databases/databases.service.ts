import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import {
  Permission,
  PermissionDocument,
} from 'src/permissions/schemas/permission.schema';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { ADMIN_ROLE, INIT_PERMISSIONS, USER_ROLE } from './sample';

@Injectable()
export class DatabasesService implements OnModuleInit {
  private readonly logger = new Logger(DatabasesService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,

    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async onModuleInit() {
    const isInit = this.configService.get<string>('SHOULD_INIT');
    console.log('check isInit: ', isInit);
    if (Boolean(isInit) === true) {
      const [countUser, countPermission, countRole] = await Promise.all([
        this.userModel.countDocuments({}),
        this.permissionModel.countDocuments({}),
        this.roleModel.countDocuments({}),
      ]);

      console.log('check: ', countUser, countPermission, countRole);

      if (countPermission === 0) {
        console.log('run here');
        await this.permissionModel.insertMany(INIT_PERMISSIONS);
      }

      if (countRole === 0) {
        console.log('run here');
        const permissions = await this.permissionModel.find({}).select('_id');
        await this.roleModel.insertMany([
          {
            name: ADMIN_ROLE,
            description: 'Có tất cả mọi quyền^^',
            isActive: true,
            permissions: permissions,
          },
          {
            name: USER_ROLE,
            description: 'Người sử dụng hệ thống',
            isActive: true,
            permissions: [],
          },
        ]);
      }

      if (countUser === 0) {
        console.log('run here');
        const adminRole = await this.roleModel.findOne({ name: ADMIN_ROLE });
        const userRole = await this.roleModel.findOne({ name: USER_ROLE });
        await this.userModel.insertMany([
          {
            name: "I'm admin",
            email: 'admin@gmail.com',
            password: this.usersService.getHashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 69,
            gender: 'MALE',
            address: 'VietNam',
            role: adminRole?._id,
          },
          {
            name: "I'm Lương Quang Trường",
            email: 'luongtruong20201@gmail.com',
            password: this.usersService.getHashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 96,
            gender: 'MALE',
            address: 'VietNam',
            role: adminRole?._id,
          },
          {
            name: "I'm normal user",
            email: 'user@gmail.com',
            password: this.usersService.getHashPassword(
              this.configService.get<string>('INIT_PASSWORD'),
            ),
            age: 69,
            gender: 'MALE',
            address: 'VietNam',
            role: userRole?._id,
          },
        ]);
      }

      if (countUser > 0 && countRole > 0 && countPermission > 0) {
        this.logger.log('Initiated data successfully');
      }
    }
  }
}
