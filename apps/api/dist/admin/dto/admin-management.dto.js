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
exports.AdminAuditLogsQueryDto = exports.AdminResolveReportDto = exports.AdminUpdatePostDto = exports.AdminPostsQueryDto = exports.AdminUpdateUserDto = exports.AdminUsersQueryDto = exports.AdminPaginationDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const USER_ROLES = ['USER', 'CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
const USER_STATUSES = ['ACTIVE', 'BANNED'];
const POST_VISIBILITY = ['VISIBLE', 'HIDDEN'];
const REPORT_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED'];
const trimString = ({ value }) => {
    if (typeof value !== 'string') {
        return value;
    }
    return value.trim();
};
class AdminPaginationDto {
    constructor() {
        this.page = 1;
        this.limit = 50;
    }
}
exports.AdminPaginationDto = AdminPaginationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AdminPaginationDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AdminPaginationDto.prototype, "limit", void 0);
class AdminUsersQueryDto extends AdminPaginationDto {
}
exports.AdminUsersQueryDto = AdminUsersQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], AdminUsersQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(USER_ROLES),
    __metadata("design:type", String)
], AdminUsersQueryDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(USER_STATUSES),
    __metadata("design:type", String)
], AdminUsersQueryDto.prototype, "status", void 0);
class AdminUpdateUserDto {
}
exports.AdminUpdateUserDto = AdminUpdateUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(USER_STATUSES),
    __metadata("design:type", String)
], AdminUpdateUserDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdminUpdateUserDto.prototype, "shadowbanned", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(USER_ROLES),
    __metadata("design:type", String)
], AdminUpdateUserDto.prototype, "role", void 0);
class AdminPostsQueryDto extends AdminPaginationDto {
}
exports.AdminPostsQueryDto = AdminPostsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AdminPostsQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(POST_VISIBILITY),
    __metadata("design:type", String)
], AdminPostsQueryDto.prototype, "visibility", void 0);
class AdminUpdatePostDto {
}
exports.AdminUpdatePostDto = AdminUpdatePostDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(POST_VISIBILITY),
    __metadata("design:type", String)
], AdminUpdatePostDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdminUpdatePostDto.prototype, "deleted", void 0);
class AdminResolveReportDto {
}
exports.AdminResolveReportDto = AdminResolveReportDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(REPORT_STATUSES),
    __metadata("design:type", String)
], AdminResolveReportDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AdminResolveReportDto.prototype, "resolutionNote", void 0);
class AdminAuditLogsQueryDto extends AdminPaginationDto {
}
exports.AdminAuditLogsQueryDto = AdminAuditLogsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], AdminAuditLogsQueryDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trimString),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], AdminAuditLogsQueryDto.prototype, "adminId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AdminAuditLogsQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AdminAuditLogsQueryDto.prototype, "to", void 0);
//# sourceMappingURL=admin-management.dto.js.map