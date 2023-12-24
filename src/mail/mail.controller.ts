import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public, ResponseMessage } from 'src/decorators/customize';
import { MailerService } from '@nestjs-modules/mailer';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import {
  Subscriber,
  SubscriberDocument,
} from 'src/subscribers/schemas/subscriber.schema';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly mailerService: MailerService,

    @InjectModel(Subscriber.name)
    private readonly subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name)
    private readonly jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  @Get()
  @Public()
  // @Cron(CronExpression.EVERY_30_SECONDS)
  @ResponseMessage('Send email')
  async sendMail() {
    const subscribers = await this.subscriberModel.find({});

    await Promise.all(
      subscribers.map(async (sub) => {
        const jobsWithSkills = await this.jobModel.find({
          skills: { $in: sub.skills },
        });

        let jobs = [];
        if (jobsWithSkills && jobsWithSkills.length > 0) {
          jobs = jobsWithSkills.map((job) => {
            return {
              name: job?.name,
              skills: job?.skills,
              salary: job?.salary?.toLocaleString(),
              company: job?.company?.name,
            };
          });

          return this.mailerService.sendMail({
            to: sub.email,
            from: 'LQT',
            subject: 'Job from luongtruong20201.com.vn',
            template: 'new-job.hbs',
            context: {
              receiver: sub.name,
              jobs,
            },
          });
        }
      }),
    );
  }

  async sendMailToReceiver(sub: any, jobsWithSkill: any) {
    let jobs = [];
    if (jobsWithSkill && jobsWithSkill.length > 0) {
      jobs = jobsWithSkill.map((job) => {
        return {
          name: job?.name,
          skills: job?.skills,
          salary: job?.salary.toLocaleString(),
          company: job?.company?.name,
        };
      });
      return this.mailerService.sendMail({
        to: sub.email,
        // to: 'luongtruong20201@gmail.com',
        from: 'LQT',
        subject: 'abc',
        template: 'new-job.hbs',
        context: {
          receiver: 'LQT',
          jobs,
        },
      });
    }
  }
}
