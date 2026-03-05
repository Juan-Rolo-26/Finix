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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const prisma_service_1 = require("../prisma.service");
let AdminGuard = class AdminGuard extends jwt_auth_guard_1.JwtAuthGuard {
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async canActivate(context) {
        const isAuth = await super.canActivate(context);
        if (!isAuth)
            return false;
        const request = context.switchToHttp().getRequest();
        const jwtUser = request.user;
        if (!jwtUser)
            throw new common_1.ForbiddenException('No user attached to request');
        const dbUser = await this.prisma.user.findUnique({
            where: { id: jwtUser.userId || jwtUser.id }
        });
        if (!dbUser)
            throw new common_1.ForbiddenException('User not found');
        if (dbUser.role !== 'ADMIN')
            throw new common_1.ForbiddenException('Requires ADMIN role');
        const allowlistConfig = (process.env.ADMIN_ALLOWLIST || '').split(',').map(e => e.trim().toLowerCase());
        if (allowlistConfig.length > 0 && allowlistConfig[0] !== '') {
            if (!allowlistConfig.includes(dbUser.email.toLowerCase())) {
                console.error(`[AdminGuard] Unauthorized access attempt by ${dbUser.email}`);
                throw new common_1.ForbiddenException('Requires ADMIN role (Not in allowlist)');
            }
        }
        request.user = dbUser;
        return true;
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminGuard);
//# sourceMappingURL=admin.guard.js.map