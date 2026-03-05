import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiWebService } from './services/ai-web.service';
import { WebSearchService } from './services/web-search.service';

@Module({
    controllers: [AiController],
    providers: [AiService, AiWebService, WebSearchService],
    exports: [AiService, AiWebService, WebSearchService],
})
export class AiModule { }
