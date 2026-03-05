import { PrismaService } from '../prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
export declare class CreatorApplicationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateApplicationDto): Promise<{
        id: string;
        status: string;
        bio: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        experience: string;
        education: string;
        documentsUrl: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    findAll(status?: string): Promise<({
        user: {
            id: string;
            email: string;
            username: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        status: string;
        bio: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        experience: string;
        education: string;
        documentsUrl: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    })[]>;
    findMyApplication(userId: string): Promise<{
        id: string;
        status: string;
        bio: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        experience: string;
        education: string;
        documentsUrl: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    updateStatus(id: string, adminId: string, dto: UpdateApplicationDto): Promise<{
        id: string;
        status: string;
        bio: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        experience: string;
        education: string;
        documentsUrl: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
}
