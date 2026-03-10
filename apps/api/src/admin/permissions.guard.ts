import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AdminPermission, getAdminPermissions } from './admin-permissions';
import { ADMIN_PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
            ADMIN_PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        ) || [];

        if (requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request & { user?: any }>();
        const user = request.user;

        if (!user?.id) {
            throw new UnauthorizedException('Sesión admin inválida');
        }

        if (this.isOwner(user)) {
            return true;
        }

        const grantedPermissions = getAdminPermissions(user.role);
        const missingPermissions = requiredPermissions.filter((permission) => !grantedPermissions.has(permission));

        if (missingPermissions.length > 0) {
            throw new ForbiddenException(`Permisos insuficientes: ${missingPermissions.join(', ')}`);
        }

        return true;
    }

    private isOwner(user: { id: string; email: string }) {
        const ownerId = (process.env.ADMIN_OWNER_USER_ID || '').trim();
        if (ownerId && user.id === ownerId) {
            return true;
        }

        const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || '').trim().toLowerCase();
        if (ownerEmail && (user.email || '').toLowerCase() === ownerEmail) {
            return true;
        }

        return false;
    }
}
