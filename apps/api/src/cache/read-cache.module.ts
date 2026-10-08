import { Global, Module } from '@nestjs/common';
import { ReadCacheService } from './read-cache.service';
@Global()
@Module({ providers: [ReadCacheService], exports: [ReadCacheService] })
export class ReadCacheModule {}
