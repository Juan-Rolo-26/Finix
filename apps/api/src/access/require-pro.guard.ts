import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isFreeAccessEnabled } from './free-access';
import { AccessControlService } from './access-control.service';

@Injectable()
export class RequireProGuard implements CanActivate {
    constructor(private readonly accessControlService: AccessControlService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            return false;
        }
        const user = await this.accessControlService.requirePro(userId);
        const privileged = user.proAccessOverride === true || ['ADMIN', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase());
        const paidPlan = ['PRO', 'PRO_INVESTOR', 'CREATOR', 'PRO_CREATOR'].includes(String(user.plan).toUpperCase())
            || ['PRO', 'CREATOR'].includes(String(user.accountType).toUpperCase());
        if (!isFreeAccessEnabled() && !privileged && !(paidPlan && ['ACTIVE', 'TRIALING'].includes(String(user.subscriptionStatus).toUpperCase()))) {
            throw new ForbiddenException('Esta funcionalidad requiere un plan PRO activo.');
        }
        return true;
    }
}

