import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import mongoose from 'mongoose';
import aqp from 'api-query-params';
import { isEmpty } from 'class-validator';

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

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.page;
    delete filter.limit;

    const offset = (currentPage - 1) * limit;
    const defaultLimit = limit ? limit : 10;
    const totalItems = (await this.companyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const companies = await this.companyModel
      .find(filter)
      .skip(offset)
      .limit(limit)
      .sort(sort as any)
      .select(projection)
      .populate(population)
      .exec();
    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems,
      },
      companies,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} company`;
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
