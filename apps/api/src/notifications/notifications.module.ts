import { Global, Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma.module';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
    imports: [PrismaModule, MailModule],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
