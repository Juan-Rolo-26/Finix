import { Global, Module } from '@nestjs/common';
import { ResendQuotaService } from './resend-quota.service';
import { MailService } from './mail.service';

@Global()
@Module({
    providers: [MailService, ResendQuotaService],
    exports: [MailService, ResendQuotaService],
})
export class MailModule { }
