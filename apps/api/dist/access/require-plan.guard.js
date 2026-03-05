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
exports.RequirePlanGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const access_control_service_1 = require("./access-control.service");
const require_plan_decorator_1 = require("./require-plan.decorator");
let RequirePlanGuard = class RequirePlanGuard {
    constructor(reflector, accessControlService) {
        this.reflector = reflector;
        this.accessControlService = accessControlService;
    }
    async canActivate(context) {
        const requiredPlans = this.reflector.getAllAndOverride(require_plan_decorator_1.REQUIRE_PLAN_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPlans || requiredPlans.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            return false;
        }
        await this.accessControlService.requirePlan(userId, requiredPlans);
        return true;
    }
};
exports.RequirePlanGuard = RequirePlanGuard;
exports.RequirePlanGuard = RequirePlanGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        access_control_service_1.AccessControlService])
], RequirePlanGuard);
//# sourceMappingURL=require-plan.guard.js.map