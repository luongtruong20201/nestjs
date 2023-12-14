import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import mongoose from 'mongoose';
import aqp from 'api-query-params';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: SoftDeleteModel<CompanyDocument>,
  ) {}

  checkCompanyId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  async create(createCompanyDto: CreateCompanyDto, user: IUser) {
    const data = {
      ...createCompanyDto,
      createdBy: { _id: user._id, email: user.email },
    };
    const company = await this.companyModel.create(data);
    return company;
  }

  async findAll(current: number, pageSize: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;
    const offset = (current - 1) * pageSize;
    const defaultLimit = pageSize ? pageSize : 10;
    const totalItems = (await this.companyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const companies = await this.companyModel
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
      companies,
    };
  }

  findOne(id: string) {
    return this.companyModel.findOne({ _id: id });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    const data = {
      ...updateCompanyDto,
      updatedBy: { _id: user._id, email: user.email },
    };
    await this.companyModel.updateOne({ _id: id }, data);
    return 'Update user successfully';
  }

  async remove(id: string, user: IUser): Promise<{ deleted: number }> {
    await this.companyModel.updateOne(
      { _id: id },
      { deletedBy: { _id: user._id, email: user.email } },
    );
    const result = await this.companyModel.softDelete({ _id: id });
    return result;
  }
}
