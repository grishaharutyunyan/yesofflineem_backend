import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly toEmail: string;

  private readonly fromEmail: string;

  constructor(config: ConfigService) {
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
    await this.transporter.sendMail({
      from: `<${this.fromEmail}>`,
      replyTo: `"${dto.name}" <${dto.email}>`,
      to: this.toEmail,
      subject: dto.subject || `New message from ${dto.name}`,
      text: dto.message,
      html: `
        <p><strong>Name:</strong> ${dto.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${dto.email}">${dto.email}</a></p>
        <hr/>
        <p style="white-space:pre-line">${dto.message}</p>
      `,
    });

    this.logger.log(`Contact email sent from ${dto.email} to ${this.toEmail}`);
  }
}