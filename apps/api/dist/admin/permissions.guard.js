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
exports.AdminPermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const admin_permissions_1 = require("./admin-permissions");
const permissions_decorator_1 = require("./permissions.decorator");
let AdminPermissionsGuard = class AdminPermissionsGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.ADMIN_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) || [];
        if (requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.id) {
            throw new common_1.UnauthorizedException('Sesión admin inválida');
        }
        if (this.isOwner(user)) {
            return true;
        }
        const grantedPermissions = (0, admin_permissions_1.getAdminPermissions)(user.role);
        const missingPermissions = requiredPermissions.filter((permission) => !grantedPermissions.has(permission));
        if (missingPermissions.length > 0) {
            throw new common_1.ForbiddenException(`Permisos insuficientes: ${missingPermissions.join(', ')}`);
        }
        return true;
    }
    isOwner(user) {
        const ownerId = (process.env.ADMIN_OWNER_USER_ID || '').trim();
        if (ownerId && user.id === ownerId) {
            return true;
        }
        const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || '').trim().toLowerCase();
        if (ownerEmail && (user.email || '').toLowerCase() === ownerEmail) {
            return true;
        }
        return false;
    }
};
exports.AdminPermissionsGuard = AdminPermissionsGuard;
exports.AdminPermissionsGuard = AdminPermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AdminPermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map