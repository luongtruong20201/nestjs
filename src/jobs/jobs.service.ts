import { Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  async create(createJobDto: CreateJobDto, user: IUser) {
    const {
      company,
      description,
      endDate,
      isActive,
      level,
      name,
      quantity,
      salary,
      skills,
      startDate,
    } = createJobDto;

    const data = {
      company,
      description,
      endDate,
      isActive,
      level,
      name,
      quantity,
      salary,
      skills,
      startDate,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    };

    const job = await this.jobModel.create(data);
    return job;
  }

  async findAll(current: number, pageSize: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    const offset = (current - 1) * pageSize;
    const defaultLimit = pageSize ? pageSize : 10;
    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const jobs = await this.jobModel
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
      jobs,
    };
  }

  async findOne(id: string) {
    const job = await this.jobModel.findOne({ _id: id });
    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto, user: IUser) {
    const result = await this.jobModel.updateOne(
      { _id: id },
      { ...updateJobDto, updatedBy: { _id: user._id, email: user.email } },
    );
    return result;
  }

  async remove(id: string, user: IUser) {
    const [result] = await Promise.all([
      this.jobModel.softDelete({ _id: id }),
      this.jobModel.updateOne(
        { _id: id },
        { deletedBy: { _id: user._id, email: user.email } },
      ),
    ]);

    return result;
  }
}
