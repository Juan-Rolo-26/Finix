import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';

@Module({
    imports: [],
    controllers: [CommunitiesController],
    providers: [CommunitiesService],
    exports: [CommunitiesService],
})
export class CommunitiesModule { }
