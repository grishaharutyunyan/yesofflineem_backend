import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ContactDto } from './dto/contact.dto';
import { ContactMessage } from './contact.entity';
import { MailService } from '../../mail/mail.service';
import { escapeHtml } from '../../mail/escape-html';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly toEmail: string;

  constructor(
    config: ConfigService,
    private readonly mail: MailService,
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {
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

    await this.mail.sendMail({
      replyTo: `"${dto.name}" <${dto.email}>`,
      to: this.toEmail,
      subject: subjectLine,
      text: dto.message,
      // Every field comes from the public contact form, so escape it before building HTML.
      html: `
        <p><strong>Source:</strong> ${escapeHtml(source)}</p>
        <p><strong>Name:</strong> ${escapeHtml(dto.name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(dto.email)}">${escapeHtml(dto.email)}</a></p>
        ${dto.phone ? `<p><strong>Phone:</strong> ${escapeHtml(dto.phone)}</p>` : ''}
        <hr/>
        <p style="white-space:pre-line">${escapeHtml(dto.message)}</p>
      `,
    });

    this.logger.log(`Contact [${source}] from ${dto.email}`);
  }

  async findAll(source?: string): Promise<ContactMessage[]> {
    const where = source ? { source } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async unreadCounts(): Promise<{ contact: number; membership: number; total: number }> {
    const rows: { source: string; count: string }[] = await this.repo
      .createQueryBuilder('m')
      .select('m.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('m.readAt IS NULL')
      .groupBy('m.source')
      .getRawMany();
    const by = Object.fromEntries(rows.map((r) => [r.source, Number(r.count)]));
    const contact = by.contact ?? 0;
    const membership = by.membership ?? 0;
    return { contact, membership, total: contact + membership };
  }

  async setRead(id: number, read: boolean): Promise<void> {
    await this.repo.update(id, { readAt: read ? new Date() : null });
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException(`Message ${id} not found`);
  }

  async markAllRead(source?: string): Promise<void> {
    await this.repo.update(
      source ? { source, readAt: IsNull() } : { readAt: IsNull() },
      { readAt: new Date() },
    );
  }
}
