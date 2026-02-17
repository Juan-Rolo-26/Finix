import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { DemoUserService } from '../demo-user.service';

@UseGuards(OptionalJwtAuthGuard)
@Controller('posts')
export class PostsController {
    constructor(
        private postsService: PostsService,
        private demoUserService: DemoUserService,
    ) { }

    private async resolveUserId(req: any) {
        if (req?.user?.id) {
            return req.user.id;
        }
        return this.demoUserService.getOrCreateDemoUserId();
    }

    @Post()
    async createPost(@Request() req, @Body() dto: CreatePostDto) {
        const userId = await this.resolveUserId(req);
        return this.postsService.createPost(userId, dto);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    uploadFile(@UploadedFile() file: any) { // Using any for Express.Multer.File to avoid type issues if not present
        return {
            url: `/uploads/${file.filename}`,
        };
    }

    @Get()
    getAllPosts(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 20;
        return this.postsService.getAllPosts(pageNum, limitNum);
    }

    @Get(':id')
    getPostById(@Param('id') id: string) {
        return this.postsService.getPostById(id);
    }

    @Put(':id')
    async updatePost(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdatePostDto,
    ) {
        const userId = await this.resolveUserId(req);
        return this.postsService.updatePost(id, userId, dto);
    }

    @Delete(':id')
    async deletePost(@Request() req, @Param('id') id: string) {
        const userId = await this.resolveUserId(req);
        return this.postsService.deletePost(id, userId);
    }

    @Post(':id/like')
    async likePost(@Request() req, @Param('id') id: string) {
        const userId = await this.resolveUserId(req);
        return this.postsService.likePost(id, userId);
    }

    @Post(':id/comment')
    async addComment(
        @Request() req,
        @Param('id') id: string,
        @Body('content') content: string,
    ) {
        const userId = await this.resolveUserId(req);
        return this.postsService.addComment(id, userId, content);
    }
}
