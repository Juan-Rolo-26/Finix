"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const posts_service_1 = require("./posts.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const optional_jwt_guard_1 = require("../auth/optional-jwt.guard");
const upload_url_util_1 = require("../uploads/upload-url.util");
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const postMediaStorage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        const dir = (0, path_1.join)(process.cwd(), 'uploads', 'posts');
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${(0, path_1.extname)(file.originalname)}`);
    },
});
let PostsController = class PostsController {
    constructor(postsService) {
        this.postsService = postsService;
    }
    getFeed(req, cursor, limit, sort, type) {
        return this.postsService.getFeed(req.user?.id, {
            cursor,
            limit: limit ? parseInt(limit) : 20,
            sort: sort || 'recent',
            type,
        });
    }
    getSaved(req, cursor, limit) {
        return this.postsService.getSavedPosts(req.user.id, cursor, limit ? parseInt(limit) : 20);
    }
    getUserPosts(req, username, cursor, limit) {
        return this.postsService.getUserPosts(username, req.user?.id, cursor, limit ? parseInt(limit) : 20);
    }
    async proxyImage(url, res) {
        if (!url)
            throw new common_1.BadRequestException('url param required');
        const allowedHosts = [
            's3.tradingview.com',
            'www.tradingview.com',
            'tradingview.com',
        ];
        let parsed;
        try {
            parsed = new URL(url);
        }
        catch {
            throw new common_1.BadRequestException('URL inválida');
        }
        const hostname = parsed.hostname.replace(/^www\./, '');
        if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
            throw new common_1.BadRequestException('URL no permitida');
        }
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Finix/1.0)',
                    'Referer': 'https://www.tradingview.com/',
                },
            });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const contentType = response.headers.get('content-type') || 'image/png';
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(buffer);
        }
        catch (e) {
            res.status(502).json({ message: 'No se pudo obtener la imagen', error: e.message });
        }
    }
    uploadMedia(files) {
        if (!files || files.length === 0)
            throw new common_1.BadRequestException('No se recibieron archivos');
        return files.map((file) => ({
            url: (0, upload_url_util_1.buildUploadPublicPath)('posts', file.filename),
            mediaType: ALLOWED_VIDEO.includes(file.mimetype) ? 'video' : 'image',
            originalName: file.originalname,
            size: file.size,
        }));
    }
    createPost(req, body) {
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
    getPost(req, id) {
        return this.postsService.getPostById(id, req.user?.id);
    }
    updatePost(req, id, content) {
        return this.postsService.updatePost(id, req.user.id, content);
    }
    deletePost(req, id) {
        const isAdmin = req.user.role === 'ADMIN';
        return this.postsService.deletePost(id, req.user.id, isAdmin);
    }
    toggleLike(req, id) {
        return this.postsService.toggleLike(id, req.user.id);
    }
    getComments(req, id, cursor, limit) {
        return this.postsService.getComments(id, req.user?.id, cursor, limit ? parseInt(limit) : 20);
    }
    addComment(req, id, content, parentId) {
        return this.postsService.addComment(id, req.user.id, content, parentId);
    }
    deleteComment(req, commentId) {
        return this.postsService.deleteComment(commentId, req.user.id);
    }
    toggleCommentLike(req, commentId) {
        return this.postsService.toggleCommentLike(commentId, req.user.id);
    }
    toggleRepost(req, id, comment) {
        return this.postsService.toggleRepost(id, req.user.id, comment);
    }
    toggleSave(req, id) {
        return this.postsService.toggleSave(id, req.user.id);
    }
    reportPost(req, id, reason) {
        return this.postsService.reportPost(id, req.user.id, reason);
    }
    getAllPosts(req, page, limit) {
        return this.postsService.getAllPosts(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, req.user?.id);
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)('feed'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getFeed", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('saved'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getSaved", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)('user/:username'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('username')),
    __param(2, (0, common_1.Query)('cursor')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getUserPosts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('proxy-image'),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "proxyImage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('upload-media'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        storage: postMediaStorage,
        limits: { fileSize: MAX_VIDEO_BYTES },
        fileFilter: (_req, file, cb) => {
            const allowed = [...ALLOWED_IMAGE, ...ALLOWED_VIDEO];
            if (!allowed.includes(file.mimetype)) {
                return cb(new common_1.BadRequestException(`Tipo no permitido: ${file.mimetype}`), false);
            }
            if (ALLOWED_VIDEO.includes(file.mimetype)) {
                return cb(new common_1.BadRequestException('No se permiten videos, solo imágenes o fotos.'), false);
            }
            if (ALLOWED_IMAGE.includes(file.mimetype) && file.size > MAX_IMAGE_BYTES) {
                return cb(new common_1.BadRequestException('Imagen demasiado grande (máx 10 MB)'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "uploadMedia", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "createPost", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getPost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('content')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "updatePost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "deletePost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/like'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "toggleLike", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('cursor')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getComments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/comment'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('content')),
    __param(3, (0, common_1.Body)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "addComment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('comment/:commentId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('comment/:commentId/like'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "toggleCommentLike", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/repost'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('comment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "toggleRepost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/save'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "toggleSave", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/report'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "reportPost", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getAllPosts", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map