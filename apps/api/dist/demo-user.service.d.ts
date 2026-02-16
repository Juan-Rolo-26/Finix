import { PrismaService } from './prisma.service';
export declare class DemoUserService {
    private prisma;
    private cachedId;
    constructor(prisma: PrismaService);
    getOrCreateDemoUserId(): Promise<string>;
}
