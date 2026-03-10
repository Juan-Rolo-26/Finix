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
exports.AdminAuthController = void 0;
const common_1 = require("@nestjs/common");
const admin_auth_service_1 = require("./admin-auth.service");
const admin_auth_dto_1 = require("./dto/admin-auth.dto");
const admin_guard_1 = require("./admin.guard");
let AdminAuthController = class AdminAuthController {
    constructor(adminAuthService) {
        this.adminAuthService = adminAuthService;
    }
    login(dto, req) {
        return this.adminAuthService.login(dto, this.getRequestMeta(req));
    }
    async verifyTwoFactor(dto, req, res) {
        const session = await this.adminAuthService.verifyTwoFactor(dto, this.getRequestMeta(req));
        this.attachSessionCookies(res, session.accessToken, session.refreshToken);
        return {
            user: session.user,
            expiresInMs: session.accessTokenTtlMs,
        };
    }
    async refresh(dto, req, res) {
        const cookies = this.adminAuthService.getCookieNames();
        const cookieToken = req.cookies?.[cookies.refresh];
        const refreshToken = cookieToken || dto.refreshToken;
        const session = await this.adminAuthService.refreshSession(refreshToken, this.getRequestMeta(req));
        this.attachSessionCookies(res, session.accessToken, session.refreshToken);
        return {
            user: session.user,
            expiresInMs: session.accessTokenTtlMs,
        };
    }
    async logout(req, res) {
        const cookies = this.adminAuthService.getCookieNames();
        const refreshToken = req.cookies?.[cookies.refresh];
        await this.adminAuthService.logout(refreshToken, this.getRequestMeta(req));
        this.clearSessionCookies(res);
        return { success: true };
    }
    async me(req) {
        if (!req.user?.id) {
            throw new common_1.UnauthorizedException('Sesión inválida');
        }
        const user = await this.adminAuthService.getMe(req.user.id);
        return { user };
    }
    attachSessionCookies(res, accessToken, refreshToken) {
        const cookieNames = this.adminAuthService.getCookieNames();
        res.cookie(cookieNames.access, accessToken, this.adminAuthService.buildAccessCookieOptions());
        res.cookie(cookieNames.refresh, refreshToken, this.adminAuthService.buildRefreshCookieOptions());
    }
    clearSessionCookies(res) {
        const cookieNames = this.adminAuthService.getCookieNames();
        const options = this.adminAuthService.buildClearCookieOptions();
        res.clearCookie(cookieNames.access, options);
        res.clearCookie(cookieNames.refresh, options);
    }
    getRequestMeta(req) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0].trim()
            : req.ip || req.socket.remoteAddress || 'unknown';
        const userAgentHeader = req.headers['user-agent'];
        return {
            ip,
            userAgent: Array.isArray(userAgentHeader) ? userAgentHeader.join(' ') : userAgentHeader,
        };
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_auth_dto_1.AdminLoginDto, Object]),
    __metadata("design:returntype", void 0)
], AdminAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-2fa'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_auth_dto_1.AdminVerifyTwoFactorDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "verifyTwoFactor", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_auth_dto_1.AdminRefreshDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "me", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, common_1.Controller)('admin/auth'),
    __metadata("design:paramtypes", [admin_auth_service_1.AdminAuthService])
], AdminAuthController);
//# sourceMappingURL=admin-auth.controller.js.map