import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
export declare class AdminGuard implements CanActivate {
    private readonly prisma;
    private readonly jwtService;
    private readonly accessCookieName;
    constructor(prisma: PrismaService, jwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractAccessToken;
    private isAdminRole;
    private extractRequestIp;
    private assertIpAllowlist;
    private isIpAllowed;
    private matchesAllowlistEntry;
}
