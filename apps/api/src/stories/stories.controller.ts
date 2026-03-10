import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoriesService } from './stories.service';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
    constructor(private readonly storiesService: StoriesService) { }

    @Get('feed')
    getFeed(@Request() req: any) {
        return this.storiesService.getFeed(req.user.id);
    }

    @Post()
    createStory(
        @Request() req: any,
        @Body() body: {
            content?: string;
            mediaUrl?: string;
            background?: string;
            textColor?: string;
        },
    ) {
        return this.storiesService.createStory(req.user.id, body);
    }

    @Post(':id/view')
    markViewed(@Request() req: any, @Param('id') id: string) {
        return this.storiesService.markViewed(id, req.user.id);
    }

    @Delete(':id')
    deleteStory(@Request() req: any, @Param('id') id: string) {
        return this.storiesService.deleteStory(id, req.user.id);
    }
}
