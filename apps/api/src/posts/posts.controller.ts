import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Request,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

// ─── Multer config ────────────────────────────────────────────────────────────

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

const postMediaStorage = diskStorage({
    destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'posts');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('posts')
export class PostsController {
    constructor(private postsService: PostsService) { }

    // ── FEED ──────────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get('feed')
    getFeed(
        @Request() req,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
        @Query('sort') sort?: string,
        @Query('type') type?: string,
    ) {
        return this.postsService.getFeed(req.user?.id, {
            cursor,
            limit: limit ? parseInt(limit) : 20,
            sort: (sort as any) || 'recent',
            type,
        });
    }

    // ── SAVED POSTS ───────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get('saved')
    getSaved(
        @Request() req,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ) {
        return this.postsService.getSavedPosts(req.user.id, cursor, limit ? parseInt(limit) : 20);
    }

    // ── USER POSTS ────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get('user/:username')
    getUserPosts(
        @Request() req,
        @Param('username') username: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ) {
        return this.postsService.getUserPosts(username, req.user?.id, cursor, limit ? parseInt(limit) : 20);
    }

    // ── PROXY IMAGE (for TradingView snapshots — avoid browser CORS) ─────────

    @UseGuards(JwtAuthGuard)
    @Get('proxy-image')
    async proxyImage(@Query('url') url: string, @Res() res: Response) {
        if (!url) throw new BadRequestException('url param required');

        // Only allow TradingView S3 images for security
        const allowedHosts = [
            's3.tradingview.com',
            'www.tradingview.com',
            'tradingview.com',
        ];
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            throw new BadRequestException('URL inválida');
        }
        const hostname = parsed.hostname.replace(/^www\./, '');
        if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
            throw new BadRequestException('URL no permitida');
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Finix/1.0)',
                    'Referer': 'https://www.tradingview.com/',
                },
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const contentType = response.headers.get('content-type') || 'image/png';
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(buffer);
        } catch (e: any) {
            res.status(502).json({ message: 'No se pudo obtener la imagen', error: e.message });
        }
    }

    // ── UPLOAD MEDIA ──────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post('upload-media')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: postMediaStorage,
            limits: { fileSize: MAX_VIDEO_BYTES },
            fileFilter: (_req, file, cb) => {
                const allowed = [...ALLOWED_IMAGE, ...ALLOWED_VIDEO];
                if (!allowed.includes(file.mimetype)) {
                    return cb(new BadRequestException(`Tipo no permitido: ${file.mimetype}`), false);
                }
                // Check if video is uploaded and return error (user explicitly requested no videos)
                if (ALLOWED_VIDEO.includes(file.mimetype)) {
                    return cb(new BadRequestException('No se permiten videos, solo imágenes o fotos.'), false);
                }
                if (ALLOWED_IMAGE.includes(file.mimetype) && file.size > MAX_IMAGE_BYTES) {
                    return cb(new BadRequestException('Imagen demasiado grande (máx 10 MB)'), false);
                }
                cb(null, true);
            },
        }),
    )
    uploadMedia(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) throw new BadRequestException('No se recibieron archivos');

        const apiBase = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
        return files.map((file) => ({
            url: `${apiBase}/uploads/posts/${file.filename}`,
            mediaType: ALLOWED_VIDEO.includes(file.mimetype) ? 'video' : 'image',
            originalName: file.originalname,
            size: file.size,
        }));
    }

    // ── CREATE POST ───────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post()
    createPost(@Request() req, @Body() body: any) {
        return this.postsService.createPost(req.user.id, {
            content: body.content,
            type: body.type,
            assetSymbol: body.assetSymbol,
            analysisType: body.analysisType,
            riskLevel: body.riskLevel,
            tickers: body.tickers,
            mediaUrls: body.mediaUrls,
            parentId: body.parentId,
            quotedPostId: body.quotedPostId,
        });
    }

    // ── GET ONE ───────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    getPost(@Request() req, @Param('id') id: string) {
        return this.postsService.getPostById(id, req.user?.id);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updatePost(@Request() req, @Param('id') id: string, @Body('content') content: string) {
        return this.postsService.updatePost(id, req.user.id, content);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    deletePost(@Request() req, @Param('id') id: string) {
        const isAdmin = req.user.role === 'ADMIN';
        return this.postsService.deletePost(id, req.user.id, isAdmin);
    }

    // ── LIKE ──────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/like')
    toggleLike(@Request() req, @Param('id') id: string) {
        return this.postsService.toggleLike(id, req.user.id);
    }

    // ── COMMENTS ──────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id/comments')
    getComments(
        @Request() req,
        @Param('id') id: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ) {
        return this.postsService.getComments(id, req.user?.id, cursor, limit ? parseInt(limit) : 20);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/comment')
    addComment(
        @Request() req,
        @Param('id') id: string,
        @Body('content') content: string,
        @Body('parentId') parentId?: string,
    ) {
        return this.postsService.addComment(id, req.user.id, content, parentId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('comment/:commentId')
    deleteComment(@Request() req, @Param('commentId') commentId: string) {
        return this.postsService.deleteComment(commentId, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('comment/:commentId/like')
    toggleCommentLike(@Request() req, @Param('commentId') commentId: string) {
        return this.postsService.toggleCommentLike(commentId, req.user.id);
    }

    // ── REPOST ────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/repost')
    toggleRepost(
        @Request() req,
        @Param('id') id: string,
        @Body('comment') comment?: string,
    ) {
        return this.postsService.toggleRepost(id, req.user.id, comment);
    }

    // ── SAVE ──────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/save')
    toggleSave(@Request() req, @Param('id') id: string) {
        return this.postsService.toggleSave(id, req.user.id);
    }

    // ── REPORT ────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post(':id/report')
    reportPost(
        @Request() req,
        @Param('id') id: string,
        @Body('reason') reason: string,
    ) {
        return this.postsService.reportPost(id, req.user.id, reason);
    }

    // ── LEGACY ────────────────────────────────────────────────────────────────

    @UseGuards(OptionalJwtAuthGuard)
    @Get()
    getAllPosts(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.postsService.getAllPosts(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            req.user?.id,
        );
    }
}
