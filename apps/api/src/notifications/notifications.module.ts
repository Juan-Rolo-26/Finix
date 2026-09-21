import { Global, Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushController } from './push.controller';
import { PushService } from './push.service';

@Global()
@Module({
    imports: [PrismaModule, MailModule],
    controllers: [PushController, NotificationsController],
    providers: [NotificationsService, PushService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
