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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const events_gateway_1 = require("../events.gateway");
const messages_service_1 = require("./messages.service");
let MessagesController = class MessagesController {
    constructor(messagesService, eventsGateway) {
        this.messagesService = messagesService;
        this.eventsGateway = eventsGateway;
    }
    getConversations(req) {
        return this.messagesService.getConversations(req.user.id);
    }
    async createOrGetConversation(req, body) {
        const conversation = await this.messagesService.createConversation(req.user.id, body);
        try {
            await this.eventsGateway.emitConversationCreated(conversation.id);
        }
        catch {
        }
        return conversation;
    }
    getMessages(id, req, cursor) {
        return this.messagesService.getMessages(id, req.user.id, cursor);
    }
    async sendMessage(id, req, body) {
        const message = await this.messagesService.sendMessage(req.user.id, id, body);
        try {
            await this.eventsGateway.emitNewMessage(id, message);
        }
        catch {
        }
        return message;
    }
    markAsRead(id, req) {
        return this.messagesService.markAsRead(id, req.user.id);
    }
    getUnreadCount(req) {
        return this.messagesService.getUnreadCount(req.user.id);
    }
    searchUsers(q, req) {
        return this.messagesService.searchUsers(q || '', req.user.id);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Post)('conversations'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "createOrGetConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('conversations/:id/read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Get)('search-users'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "searchUsers", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        events_gateway_1.EventsGateway])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map