import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE']);

@Injectable()
export class CreatorGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;

        if (!userId) {
            throw new UnauthorizedException('No autenticado.');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                plan: true,
                accountType: true,
                isCreator: true,
                subscriptionStatus: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado.');
        }

        const adminRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
        if (adminRoles.has(user.role)) {
            return true;
        }

        const isCreator = (
            user.isCreator ||
            user.role === 'CREATOR' ||
            user.accountType === 'CREATOR' ||
            user.plan === 'CREATOR' ||
            user.plan === 'PRO_CREATOR'
        ) && (
            user.isCreator ||
            user.role === 'CREATOR' ||
            ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus)
        );

        if (!isCreator) {
            throw new ForbiddenException(
                'Esta funcionalidad requiere el Plan Creator de Finix. No tienes permisos para crear o administrar comunidades con tu plan actual.'
            );
        }

        return true;
    }
}
