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
exports.CommunitiesController = void 0;
const common_1 = require("@nestjs/common");
const communities_service_1 = require("./communities.service");
const create_community_dto_1 = require("./dto/create-community.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const optional_jwt_guard_1 = require("../auth/optional-jwt.guard");
const require_paid_community_access_guard_1 = require("../access/require-paid-community-access.guard");
const require_creator_guard_1 = require("../access/require-creator.guard");
let CommunitiesController = class CommunitiesController {
    constructor(communitiesService) {
        this.communitiesService = communitiesService;
    }
    create(req, createCommunityDto) {
        return this.communitiesService.create(req.user.id, createCommunityDto);
    }
    findAll(query) {
        return this.communitiesService.findAll(query);
    }
    myCommunities(req) {
        return this.communitiesService.getMyCommunities(req.user.id);
    }
    creatorStats(req) {
        return this.communitiesService.getCreatorStats(req.user.id);
    }
    listPosts(id, req) {
        return this.communitiesService.listPosts(id, req.user?.id);
    }
    createPost(id, req, dto) {
        return this.communitiesService.createPost(req.user.id, id, dto);
    }
    listResources(id, req) {
        return this.communitiesService.listResources(id, req.user?.id);
    }
    createResource(id, req, dto) {
        return this.communitiesService.createResource(req.user.id, id, dto);
    }
    getCommunityStats(id, req) {
        return this.communitiesService.getCommunityStats(id, req.user?.id);
    }
    async findOne(id, req) {
        return this.communitiesService.findOne(id, req.user?.id);
    }
    join(id, req) {
        return this.communitiesService.joinFree(req.user.id, id);
    }
    subscribe(id, req) {
        return this.communitiesService.createSubscriptionSession(req.user.id, id);
    }
    checkPaidAccess() {
        return { access: true };
    }
    members(id, req) {
        return this.communitiesService.getCommunityMembers(req.user.id, id);
    }
    updatePricing(id, req, dto) {
        return this.communitiesService.updatePricing(req.user.id, id, dto);
    }
    removeMember(id, memberUserId, req) {
        return this.communitiesService.removeMember(req.user.id, id, memberUserId);
    }
};
exports.CommunitiesController = CommunitiesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, require_creator_guard_1.RequireCreatorGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_community_dto_1.CreateCommunityDto]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, require_creator_guard_1.RequireCreatorGuard),
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "myCommunities", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, require_creator_guard_1.RequireCreatorGuard),
    (0, common_1.Get)('creator/stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "creatorStats", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id/posts'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "listPosts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/posts'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_community_dto_1.CreateCommunityPostDto]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "createPost", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id/resources'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "listResources", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/resources'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_community_dto_1.CreateCommunityResourceDto]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "createResource", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "getCommunityStats", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CommunitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "join", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/subscribe'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "subscribe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, require_paid_community_access_guard_1.RequirePaidCommunityAccessGuard),
    (0, common_1.Get)(':id/private-access'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "checkPaidAccess", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, require_creator_guard_1.RequireCreatorGuard),
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "members", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, require_creator_guard_1.RequireCreatorGuard),
    (0, common_1.Patch)(':id/pricing'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_community_dto_1.UpdateCommunityDto]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "updatePricing", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, require_creator_guard_1.RequireCreatorGuard),
    (0, common_1.Delete)(':id/members/:memberUserId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('memberUserId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CommunitiesController.prototype, "removeMember", null);
exports.CommunitiesController = CommunitiesController = __decorate([
    (0, common_1.Controller)('communities'),
    __metadata("design:paramtypes", [communities_service_1.CommunitiesService])
], CommunitiesController);
//# sourceMappingURL=communities.controller.js.map