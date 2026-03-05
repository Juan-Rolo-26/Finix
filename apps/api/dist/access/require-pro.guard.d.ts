import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
export declare class RequireProGuard implements CanActivate {
    private readonly accessControlService;
    constructor(accessControlService: AccessControlService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
