import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma.service';
import { DemoUserService } from '../demo-user.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Module({
    controllers: [PostsController],
    providers: [PostsService, PrismaService, DemoUserService, OptionalJwtAuthGuard],
    exports: [PostsService],
})
export class PostsModule { }
