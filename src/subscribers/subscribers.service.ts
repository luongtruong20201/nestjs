import { BadRequestException, Injectable, Query } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { SubscriberDocument } from './schemas/subscriber.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Subscriber } from 'rxjs';
import { IUser } from 'src/users/users.interface';
import { ResponseMessage } from 'src/decorators/customize';
import aqp from 'api-query-params';
import { userInfo } from 'os';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private readonly subscriberModel: SoftDeleteModel<SubscriberDocument>,
  ) {}

  async create(createSubscriberDto: CreateSubscriberDto, user: IUser) {
    const { email, name, skills } = createSubscriberDto;
    const isExist = await this.subscriberModel.findOne({ email });
    if (isExist) {
      throw new BadRequestException('Subscriber đã tồn tại');
    }

    const result = await this.subscriberModel.create({
      email,
      name,
      skills,
      updatedBy: { _id: user._id, email: user.email },
    });
    return result;
  }

  @ResponseMessage('Get subscribers with paginate')
  async findAll(current: number, pageSize: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    const offset = (current - 1) * pageSize;
    const defaultLimit = pageSize ? pageSize : 10;
    const totalItems = (await this.subscriberModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const subscribers = await this.subscriberModel
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
      result: subscribers,
    };
  }

  async findOne(id: string) {
    const subscriber = await this.subscriberModel.findById(id);
    return subscriber;
  }

  async update(
    id: string,
    updateSubscriberDto: UpdateSubscriberDto,
    user: IUser,
  ) {
    const { email, name, skills } = updateSubscriberDto;
    const isExist = await this.subscriberModel.findOne({
      _id: { $ne: id },
      email,
    });

    if (isExist) {
      throw new BadRequestException(
        'Email đã tồn tại, vui lòng sử dụng email khác',
      );
    }

    const result = await this.subscriberModel.updateOne(
      { _id: id },
      { email, name, skills, updatedBy: { _id: user._id, email: user.email } },
    );

    return result;
  }

  async remove(id: string, user: IUser) {
    const [, result] = await Promise.all([
      this.subscriberModel.updateOne(
        { _id: id },
        { deletedBy: { _id: user._id, emal: user.email } },
      ),
      this.subscriberModel.softDelete({ _id: id }),
    ]);

    return result;
  }
}
