import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [MulterModule.register({}), NotificationsModule],
    controllers: [PostsController],
    providers: [PostsService, OptionalJwtAuthGuard],
    exports: [PostsService],
})
export class PostsModule { }
