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
  @ResponseMessage('Send email')
  @Cron(CronExpression.EVERY_30_SECONDS)
  async sendMail() {
    let jobs = [];

    const subscribers = await this.subscriberModel.find({});

    for (const sub of subscribers) {
      const subSkills = sub.skills;

      const jobsWithSkill = await this.jobModel.find({
        skills: { $in: subSkills },
      });

      if (jobsWithSkill && jobsWithSkill.length > 0) {
        jobs = jobsWithSkill.map((job) => {
          return {
            name: job?.name,
            skills: job?.skills,
            salary: job?.salary.toLocaleString(),
            company: job?.company?.name,
          };
        });
        this.mailerService
          .sendMail({
            to: 'quynh01s9traveldn@gmail.com',
            // to: 'luongtruong20201@gmail.com',
            from: 'LQT',
            subject: 'abc',
            template: 'new-job.hbs',
            context: {
              receiver: 'LQT',
              jobs,
            },
          })
          .then(() => {
            console.log('ok');
          });
      }
    }
  }
}
