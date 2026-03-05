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
exports.RequirePaidCommunityAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const access_control_service_1 = require("./access-control.service");
let RequirePaidCommunityAccessGuard = class RequirePaidCommunityAccessGuard {
    constructor(accessControlService) {
        this.accessControlService = accessControlService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        const communityId = request.params?.id || request.params?.communityId;
        if (!userId) {
            return false;
        }
        if (!communityId || typeof communityId !== 'string') {
            throw new common_1.BadRequestException('communityId es requerido');
        }
        await this.accessControlService.requirePaidCommunityAccess(userId, communityId);
        return true;
    }
};
exports.RequirePaidCommunityAccessGuard = RequirePaidCommunityAccessGuard;
exports.RequirePaidCommunityAccessGuard = RequirePaidCommunityAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [access_control_service_1.AccessControlService])
], RequirePaidCommunityAccessGuard);
//# sourceMappingURL=require-paid-community-access.guard.js.map