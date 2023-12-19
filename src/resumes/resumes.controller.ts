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
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { ResponseMessage, User } from 'src/decorators/customize';
import { IUser } from 'src/users/users.interface';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @ResponseMessage('Create resume')
  @Post()
  async create(@Body() createResumeDto: CreateResumeDto, @User() user: IUser) {
    const result = await this.resumesService.create(createResumeDto, user);
    return { _id: result._id, createdAt: result.createdAt };
  }

  @ResponseMessage('Get resume with pagination')
  @Get()
  findAll(
    @Query() qs: string,
    @Query('current') current: string,
    @Query('pageSize') limit: string,
  ) {
    return this.resumesService.findAll(+current, +limit, qs);
  }

  @ResponseMessage('Fetch resume by id')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.resumesService.findOne(id);
    return result;
  }

  @ResponseMessage('Get resumes by user')
  @Post('by-user')
  async findResumeByUser(@User() user: IUser) {
    return this.resumesService.findResumeByUser(user);
  }

  @ResponseMessage('Update status resume')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('status') status: string,
    @User() user: IUser,
  ) {
    return this.resumesService.update(id, status, user);
  }

  @ResponseMessage('delete resume')
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.resumesService.remove(id, user);
  }
}
