import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResponseMessage, User } from 'src/decorators/customize';
import { IUser } from 'src/users/users.interface';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ResponseMessage('Create role')
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto, @User() user: IUser) {
    const result = await this.rolesService.create(createRoleDto, user);
    return { _id: result?._id, createdAt: result.createdAt };
  }

  @ResponseMessage('Get role with pagination')
  @Get()
  findAll(
    @Query() qs: string,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.rolesService.findAll(+current, +pageSize, qs);
  }

  @ResponseMessage('Get role by id')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @ResponseMessage('Update a role')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: IUser,
  ) {
    return this.rolesService.update(id, updateRoleDto, user);
  }

  @ResponseMessage('Delete role')
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.rolesService.remove(id, user);
  }
}
