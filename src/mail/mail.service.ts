import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Owns the single SMTP connection for the app. Every outgoing email goes
 * through this service, so the transporter/credentials live in exactly one
 * place. Use `verifyConnection()` on startup to confirm the connection.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly host: string;
  private readonly user: string;

  constructor(config: ConfigService) {
    this.host = config.get<string>('smtp.host');
    this.user = config.get<string>('smtp.user');
    this.transporter = nodemailer.createTransport({
      host: this.host,
      port: config.get<number>('smtp.port'),
      secure: config.get<boolean>('smtp.secure'),
      auth: { user: this.user, pass: config.get<string>('smtp.pass') },
    });
  }

  /** Default `from` address for outgoing mail (the authenticated SMTP user). */
  get fromAddress(): string {
    return this.user;
  }

  /**
   * Verifies the SMTP connection and credentials, logging the outcome. Never
   * throws — a broken mail connection must not take the server down — and
   * returns whether the connection is usable.
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.host || !this.user) {
      this.logger.warn('SMTP not configured (missing host/user) — outgoing email is disabled');
      return false;
    }
    try {
      await this.transporter.verify();
      this.logger.log(`SMTP connection established — ${this.user} via ${this.host}`);
      return true;
    } catch (err) {
      this.logger.error(`SMTP connection failed — ${this.user} via ${this.host}`, err as Error);
      return false;
    }
  }

  /** Sends an email, defaulting the `from` header to the SMTP user. */
  async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    await this.transporter.sendMail({ from: `<${this.user}>`, ...options });
  }
}
