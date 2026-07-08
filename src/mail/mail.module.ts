import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Global so any feature module can inject MailService without re-importing,
 * and so main.ts can resolve it for the startup connection check.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
