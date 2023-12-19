import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Resume, ResumeDocument } from './schema/resume.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { CompaniesService } from 'src/companies/companies.service';
import { JobsService } from 'src/jobs/jobs.service';
import aqp from 'api-query-params';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private readonly resumeModel: SoftDeleteModel<ResumeDocument>,
    private readonly companiesService: CompaniesService,
    private readonly jobsService: JobsService,
  ) {}

  async create(createResumeDto: CreateResumeDto, user: IUser) {
    const { companyId, jobId, url } = createResumeDto;
    const { _id, email } = user;
    const [company, job] = await Promise.all([
      this.companiesService.checkCompanyExist(companyId.toString()),
      this.jobsService.checkJobExist(jobId.toString()),
    ]);

    if (!(job && company)) {
      throw new BadRequestException('Vui lòng thử lại sau');
    }

    const updatedBy = { _id, email };

    const data = {
      email: user.email,
      userId: user._id,
      jobId: jobId,
      status: 'PENDING',
      history: [
        {
          status: 'PENDING',
          updatedAt: new Date(),
          updatedBy,
        },
      ],
      createdBy: updatedBy,
      url,
      companyId,
    };

    const result = await this.resumeModel.create(data);
    return result;
  }

  async findAll(current: number, pageSize: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    const offset = (current - 1) * pageSize;
    const defaultLimit = pageSize ? pageSize : 10;
    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const resumes = await this.resumeModel
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
      result: resumes,
    };
  }

  async findOne(id: string) {
    const result = await this.resumeModel.findById(id);
    return result;
  }

  async update(id: string, status: string, user: IUser) {
    const { _id, email } = user;
    const history = {
      status: status,
      updatedAt: new Date(),
      updatedBy: { _id, email },
    };

    const result = await this.resumeModel.updateOne(
      { _id: id },
      { $push: { history }, status },
    );

    return result;
  }

  async remove(id: string, user: IUser) {
    const [, result] = await Promise.all([
      this.resumeModel.updateOne(
        { _id: id },
        { deletedBy: { _id: user._id, email: user.email } },
      ),
      this.resumeModel.softDelete({ _id: id }),
    ]);
    return result;
  }

  async findResumeByUser(user: IUser) {
    const resumes = await this.resumeModel.find({ userId: user._id });
    return resumes;
  }
}
