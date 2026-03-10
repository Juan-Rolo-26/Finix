import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ─── Multer config ────────────────────────────────────────────────────────────

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const avatarStorage = diskStorage({
    destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'avatars');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
    },
});

const bannerStorage = diskStorage({
    destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads', 'banners');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
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

    // ─── Avatar upload ────────────────────────────────────────────────────────

    @Post('avatar')
    @UseInterceptors(
        FileInterceptor('avatar', {
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
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');

        // Build the public URL
        const apiBase = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
        const avatarUrl = `${apiBase}/uploads/avatars/${file.filename}`;

        // Persist to DB
        await this.settingsService.saveAvatarUrl(req.user.id, avatarUrl);

        return { avatarUrl };
    }

    @Post('banner')
    @UseInterceptors(
        FileInterceptor('banner', {
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
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('No se recibió ningún archivo');

        const apiBase = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
        const bannerUrl = `${apiBase}/uploads/banners/${file.filename}`;

        await this.settingsService.saveBannerUrl(req.user.id, bannerUrl);

        return { bannerUrl };
    }
}
