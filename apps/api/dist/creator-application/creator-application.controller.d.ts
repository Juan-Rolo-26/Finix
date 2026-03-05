import { CreatorApplicationService } from './creator-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PrismaService } from '../prisma.service';
export declare class CreatorApplicationController {
    private readonly service;
    private readonly prisma;
    constructor(service: CreatorApplicationService, prisma: PrismaService);
    apply(req: any, dto: CreateApplicationDto): Promise<{
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
    getMyApplication(req: any): Promise<{
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
    findAll(req: any, status?: string): Promise<({
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
    updateStatus(req: any, id: string, dto: UpdateApplicationDto): Promise<{
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
