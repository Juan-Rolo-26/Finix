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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const billing_service_1 = require("./billing.service");
const payout_request_dto_1 = require("./dto/payout-request.dto");
let BillingController = class BillingController {
    constructor(billingService) {
        this.billingService = billingService;
    }
    getOverview(req) {
        return this.billingService.getPaymentOverview(req.user.id);
    }
    getHistory(req) {
        return this.billingService.getPaymentHistory(req.user.id);
    }
    cancelSubscription(req) {
        return this.billingService.cancelProSubscription(req.user.id);
    }
    getCreatorSummary(req) {
        return this.billingService.getCreatorSummary(req.user.id);
    }
    settlePendingBalance(req) {
        return this.billingService.settlePendingBalance(req.user.id);
    }
    requestPayout(req, body) {
        return this.billingService.requestPayout(req.user.id, Number(body.amount));
    }
    listPayouts(req) {
        return this.billingService.listPayouts(req.user.id);
    }
    getAdminSettings(req) {
        this.assertAdmin(req);
        return this.billingService.getAdminSettings();
    }
    updateCommission(req, body) {
        this.assertAdmin(req);
        return this.billingService.updateCommissionRate(Number(body.rate));
    }
    assertAdmin(req) {
        if (req?.user?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Acceso denegado: solo ADMIN');
        }
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('subscription/cancel'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)('creator/summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getCreatorSummary", null);
__decorate([
    (0, common_1.Post)('creator/settle'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "settlePendingBalance", null);
__decorate([
    (0, common_1.Post)('creator/payout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payout_request_dto_1.PayoutRequestDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Get)('creator/payouts'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "listPayouts", null);
__decorate([
    (0, common_1.Get)('admin/settings'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAdminSettings", null);
__decorate([
    (0, common_1.Post)('admin/commission'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "updateCommission", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map