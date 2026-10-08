import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ReadCacheModule } from './cache/read-cache.module';

@Global()
@Module({
    imports: [ReadCacheModule],
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {}
