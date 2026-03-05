import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from './access-control.service';
import { REQUIRE_PLAN_KEY } from './require-plan.decorator';
import { PlanType } from './plan-permissions';

@Injectable()
export class RequirePlanGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly accessControlService: AccessControlService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPlans = this.reflector.getAllAndOverride<PlanType[]>(REQUIRE_PLAN_KEY, [
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
}
