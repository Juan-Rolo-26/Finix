import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AccessControlService } from './access-control.service';

@Injectable()
export class RequireCreatorGuard implements CanActivate {
    constructor(private readonly accessControlService: AccessControlService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            return false;
        }

        await this.accessControlService.requireCreator(userId);
        return true;
    }
}
