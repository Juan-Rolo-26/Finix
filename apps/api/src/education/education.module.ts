import { Module } from '@nestjs/common';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { PrismaModule } from '../prisma.module';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [PrismaModule, AdminModule],
    controllers: [EducationController],
    providers: [EducationService],
    exports: [EducationService],
})
export class EducationModule {}
