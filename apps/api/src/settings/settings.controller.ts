import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFiles,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { mkdirSync, openSync, readSync, closeSync, unlinkSync, chmodSync } from 'fs';
import { verificationStorageRoot, validVerificationSignature } from './verification-storage';
import { randomUUID } from 'crypto';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { buildUploadPublicPath, getUploadFolder } from '../uploads/upload-url.util';

// ─── Multer config ────────────────────────────────────────────────────────────

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const avatarStorage = diskStorage({
    destination: (_req, _file, cb) => {
        const dir = getUploadFolder('avatars');
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

const bannerStorage = diskStorage({
    destination: (_req, _file, cb) => {
        const dir = getUploadFolder('banners');
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

const verificationStorage = diskStorage({
    destination: (_req, _file, cb) => {
        const root = verificationStorageRoot();
        const dir = resolve(root, 'financial-verifications');
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        cb(null, dir);
    },
    filename: (req: any, file, cb) => {
        const extensions = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
        cb(null, `${req.user.id}-${randomUUID()}${extensions[file.mimetype]}`);
    },
});

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('me')
@UseGuards(JwtAuthGuard)
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get('settings')
    getSettings(@Request() req) {
        return this.settingsService.getSettings(req.user.id);
    }

    @Patch('privacy')
    updatePrivacy(@Request() req, @Body() body: any) {
        return this.settingsService.updatePrivacy(req.user.id, body);
    }

    @Patch('preferences')
    updatePreferences(@Request() req, @Body() body: any) {
        return this.settingsService.updatePreferences(req.user.id, body);
    }

    @Patch('onboarding')
    updateOnboarding(@Request() req, @Body() body: any) {
        return this.settingsService.updateOnboarding(req.user.id, body);
    }

    @Post('logout-all')
    logoutAll(@Request() req) {
        return this.settingsService.logoutAllSessions(req.user.id);
    }

    @Delete('account')
    deleteAccount(@Request() req) {
        return this.settingsService.deleteAccount(req.user.id);
    }

    // ─── Financial Verification ───────────────────────────────────────────────

    @Get('verification')
    async getVerification(@Request() req) {
        return (await this.settingsService.getVerification(req.user.id)) ?? { status: 'not_requested' };
    }

    @Post('verification/documents')
    @UseInterceptors(FileInterceptor('file', {
        storage: verificationStorage,
        limits: { fileSize: MAX_SIZE_BYTES },
        fileFilter: (_req, file, cb) => {
            if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                return cb(new BadRequestException('Solo se permiten documentos PDF, JPG, PNG o WEBP de hasta 5 MB'), false);
            }
            cb(null, true);
        },
    }))
    uploadVerificationDocument(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');
        const descriptor = openSync(file.path, 'r');
        const header = Buffer.alloc(12);
        try { readSync(descriptor, header, 0, 12, 0); } finally { closeSync(descriptor); }
        if (!validVerificationSignature(header, file.mimetype)) {
            unlinkSync(file.path);
            throw new BadRequestException('El archivo no coincide con el formato permitido');
        }
        chmodSync(file.path, 0o600);
        return { path: `financial-verifications/${file.filename}` };
    }

    @Post('verification')
    submitVerification(@Request() req, @Body() body: any) {
        return this.settingsService.submitVerification(req.user.id, body);
    }

    // ─── Avatar upload ────────────────────────────────────────────────────────

    @Post('avatar')
    @UseInterceptors(
        AnyFilesInterceptor({
            storage: avatarStorage,
            limits: { fileSize: MAX_SIZE_BYTES },
            fileFilter: (_req, file, cb) => {
                if (!ALLOWED_MIME.includes(file.mimetype)) {
                    return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP o GIF'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadAvatar(
        @Request() req,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        // Accept the canonical `avatar` field and the generic `file` field
        // used by some mobile/web upload clients.
        const file = files?.find((candidate) => candidate.fieldname === 'avatar' || candidate.fieldname === 'file');
        if (!file) throw new BadRequestException('No se recibió ningún archivo');

        const avatarUrl = buildUploadPublicPath('avatars', file.filename);

        // Persist to DB
        await this.settingsService.saveAvatarUrl(req.user.id, avatarUrl);

        return { avatarUrl };
    }

    @Post('banner')
    @UseInterceptors(
        AnyFilesInterceptor({
            storage: bannerStorage,
            limits: { fileSize: MAX_SIZE_BYTES },
            fileFilter: (_req, file, cb) => {
                if (!ALLOWED_MIME.includes(file.mimetype)) {
                    return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP o GIF'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadBanner(
        @Request() req,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        const file = files?.find((candidate) => candidate.fieldname === 'banner' || candidate.fieldname === 'file');
        if (!file) throw new BadRequestException('No se recibió ningún archivo');

        const bannerUrl = buildUploadPublicPath('banners', file.filename);

        await this.settingsService.saveBannerUrl(req.user.id, bannerUrl);

        return { bannerUrl };
    }
}
