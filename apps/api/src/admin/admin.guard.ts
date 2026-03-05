import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
    constructor(private prisma: PrismaService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check JWT first
        const isAuth = await super.canActivate(context);
        if (!isAuth) return false;

        const request = context.switchToHttp().getRequest();
        const jwtUser = request.user;

        if (!jwtUser) throw new ForbiddenException('No user attached to request');

        // Fetch full user from DB to verify role and status
        const dbUser = await this.prisma.user.findUnique({
            where: { id: jwtUser.userId || jwtUser.id }
        });

        if (!dbUser) throw new ForbiddenException('User not found');
        if (dbUser.role !== 'ADMIN') throw new ForbiddenException('Requires ADMIN role');

        // Read ALLOWLIST from env
        const allowlistConfig = (process.env.ADMIN_ALLOWLIST || '').split(',').map(e => e.trim().toLowerCase());
        if (allowlistConfig.length > 0 && allowlistConfig[0] !== '') {
            if (!allowlistConfig.includes(dbUser.email.toLowerCase())) {
                console.error(`[AdminGuard] Unauthorized access attempt by ${dbUser.email}`);
                throw new ForbiddenException('Requires ADMIN role (Not in allowlist)');
            }
        }

        // Attach DB user to request
        request.user = dbUser;

        return true;
    }
}
