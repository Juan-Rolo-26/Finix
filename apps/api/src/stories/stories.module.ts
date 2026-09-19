import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    controllers: [StoriesController],
    providers: [StoriesService],
    exports: [StoriesService],
})
export class StoriesModule { }
