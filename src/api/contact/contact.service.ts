import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactDto } from './dto/contact.dto';
import { ContactMessage } from './contact.entity';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly toEmail: string;
  private readonly fromEmail: string;

  constructor(
    config: ConfigService,
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {
    this.fromEmail = config.get<string>('smtp.user');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('smtp.host'),
      port: config.get<number>('smtp.port'),
      secure: config.get<boolean>('smtp.secure'),
      auth: {
        user: this.fromEmail,
        pass: config.get<string>('smtp.pass'),
      },
    });
    this.toEmail = config.get<string>('smtp.contactToEmail');
  }

  async send(dto: ContactDto): Promise<void> {
    const source = dto.source || 'contact';

    await this.repo.save({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      source,
      message: dto.message,
    });

    const subjectLine = source === 'membership'
      ? `Membership inquiry from ${dto.name}`
      : `New message from ${dto.name}`;

    await this.transporter.sendMail({
      from: `<${this.fromEmail}>`,
      replyTo: `"${dto.name}" <${dto.email}>`,
      to: this.toEmail,
      subject: subjectLine,
      text: dto.message,
      html: `
        <p><strong>Source:</strong> ${source}</p>
        <p><strong>Name:</strong> ${dto.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${dto.email}">${dto.email}</a></p>
        ${dto.phone ? `<p><strong>Phone:</strong> ${dto.phone}</p>` : ''}
        <hr/>
        <p style="white-space:pre-line">${dto.message}</p>
      `,
    });

    this.logger.log(`Contact [${source}] from ${dto.email}`);
  }

  async findAll(source?: string): Promise<ContactMessage[]> {
    const where = source ? { source } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }
}
