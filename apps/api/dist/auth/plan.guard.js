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
exports.PlanGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const shared_1 = require("@finix/shared");
let PlanGuard = class PlanGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPlans = this.reflector.getAllAndOverride('plans', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPlans || requiredPlans.length === 0) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }
        const planWeights = {
            'BASIC': 0,
            [shared_1.AccountPlan.FREE]: 0,
            [shared_1.AccountPlan.PRO]: 1,
            [shared_1.AccountPlan.CREATOR]: 2
        };
        const userPlan = user.accountType || shared_1.AccountPlan.FREE;
        const userWeight = planWeights[userPlan] ?? 0;
        const isAllowed = requiredPlans.some(plan => userWeight >= (planWeights[plan] ?? 0));
        if (!isAllowed) {
            throw new common_1.ForbiddenException(`Esta funcionalidad requiere uno de los siguientes planes: ${requiredPlans.join(', ')}`);
        }
        return true;
    }
};
exports.PlanGuard = PlanGuard;
exports.PlanGuard = PlanGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PlanGuard);
//# sourceMappingURL=plan.guard.js.map