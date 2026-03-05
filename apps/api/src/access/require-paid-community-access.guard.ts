import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AccessControlService } from './access-control.service';

@Injectable()
export class RequirePaidCommunityAccessGuard implements CanActivate {
    constructor(private readonly accessControlService: AccessControlService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        const communityId = request.params?.id || request.params?.communityId;

        if (!userId) {
            return false;
        }

        if (!communityId || typeof communityId !== 'string') {
            throw new BadRequestException('communityId es requerido');
        }

        await this.accessControlService.requirePaidCommunityAccess(userId, communityId);
        return true;
    }
}

