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
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { ResponseMessage, User } from 'src/decorators/customize';
import { IUser } from 'src/users/users.interface';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  @ResponseMessage('Create subscriber')
  async create(
    @Body() createSubscriberDto: CreateSubscriberDto,
    @User() user: IUser,
  ) {
    const result = await this.subscribersService.create(
      createSubscriberDto,
      user,
    );

    return { _id: result._id, createdAt: result.createdAt };
  }

  @Get()
  findAll(
    @Query() qs: string,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.subscribersService.findAll(+current, +pageSize, qs);
  }

  @Get(':id')
  @ResponseMessage('Get subscriber by id')
  findOne(@Param('id') id: string) {
    return this.subscribersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriberDto: UpdateSubscriberDto,
    @User() user: IUser,
  ) {
    return this.subscribersService.update(id, updateSubscriberDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.subscribersService.remove(id, user);
  }
}
