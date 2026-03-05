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
exports.CreatorApplicationController = void 0;
const common_1 = require("@nestjs/common");
const creator_application_service_1 = require("./creator-application.service");
const create_application_dto_1 = require("./dto/create-application.dto");
const update_application_dto_1 = require("./dto/update-application.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const prisma_service_1 = require("../prisma.service");
let CreatorApplicationController = class CreatorApplicationController {
    constructor(service, prisma) {
        this.service = service;
        this.prisma = prisma;
    }
    apply(req, dto) {
        return this.service.create(req.user.id, dto);
    }
    getMyApplication(req) {
        return this.service.findMyApplication(req.user.id);
    }
    async findAll(req, status) {
        const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        if (user?.role !== 'ADMIN') {
            throw new common_1.UnauthorizedException('Requiere permisos de administrador');
        }
        return this.service.findAll(status);
    }
    async updateStatus(req, id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        if (user?.role !== 'ADMIN') {
            throw new common_1.UnauthorizedException('Requiere permisos de administrador');
        }
        return this.service.updateStatus(id, req.user.id, dto);
    }
};
exports.CreatorApplicationController = CreatorApplicationController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_application_dto_1.CreateApplicationDto]),
    __metadata("design:returntype", void 0)
], CreatorApplicationController.prototype, "apply", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CreatorApplicationController.prototype, "getMyApplication", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CreatorApplicationController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_application_dto_1.UpdateApplicationDto]),
    __metadata("design:returntype", Promise)
], CreatorApplicationController.prototype, "updateStatus", null);
exports.CreatorApplicationController = CreatorApplicationController = __decorate([
    (0, common_1.Controller)('creator-application'),
    __metadata("design:paramtypes", [creator_application_service_1.CreatorApplicationService,
        prisma_service_1.PrismaService])
], CreatorApplicationController);
//# sourceMappingURL=creator-application.controller.js.map