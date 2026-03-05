import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Module({
    imports: [MulterModule.register({})],
    controllers: [PostsController],
    providers: [PostsService, PrismaService, OptionalJwtAuthGuard],
    exports: [PostsService],
})
export class PostsModule { }
