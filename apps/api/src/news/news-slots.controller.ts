import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { NewsSlotsService } from './news-slots.service';
import { AdminGuard } from '../admin/admin.guard';
import type { Request } from 'express';

// ─── Public controller (for the web frontend) ─────────────────────────────────

@Controller('news/slots')
export class NewsSlotsPublicController {
    constructor(private readonly slotsService: NewsSlotsService) {}

    /** GET /news/slots/categories — all active categories */
    @Get('categories')
    getCategories() {
        return this.slotsService.getPublicCategories();
    }

    /** GET /news/slots/headlines — published headlines across active slots */
    @Get('headlines')
    getHeadlines(@Query('limit') limit?: string) {
        return this.slotsService.getPublicHeadlines(limit ? parseInt(limit, 10) : 6);
    }

    /** GET /news/slots/category/:slug — category + 5 slots with published articles */
    @Get('category/:slug')
    getCategorySlots(@Param('slug') slug: string) {
        return this.slotsService.getPublicCategorySlots(slug);
    }

    /** POST /news/slots/:slotId/click — register a click for tracking */
    @Post(':slotId/click')
    @HttpCode(HttpStatus.OK)
    registerClick(@Param('slotId') slotId: string) {
        return this.slotsService.registerClick(slotId);
    }
}

// ─── Admin controller (protected by AdminGuard) ───────────────────────────────

@Controller('admin/news/slots')
@UseGuards(AdminGuard)
export class NewsSlotsAdminController {
    constructor(private readonly slotsService: NewsSlotsService) {}

    /** GET /admin/news/slots/categories — all categories (including inactive) */
    @Get('categories')
    getAdminCategories() {
        return this.slotsService.getAdminCategories();
    }

    /** POST /admin/news/slots/categories — create a new category */
    @Post('categories')
    createCategory(@Body() body: any) {
        return this.slotsService.createCategory(body);
    }

    /** PATCH /admin/news/slots/categories/:id — update a category */
    @Patch('categories/:id')
    updateCategory(@Param('id') id: string, @Body() body: any) {
        return this.slotsService.updateCategory(id, body);
    }

    /** GET /admin/news/slots/category/:slug — slots + articles + history for admin */
    @Get('category/:slug')
    getAdminCategorySlots(@Param('slug') slug: string) {
        return this.slotsService.getAdminCategorySlots(slug);
    }

    /** POST /admin/news/slots/scrape-preview — scrape a URL and return metadata preview */
    @Post('scrape-preview')
    @HttpCode(HttpStatus.OK)
    scrapePreview(@Body() body: { url: string }) {
        return this.slotsService.scrapeUrlPreview(body.url);
    }

    /** PATCH /admin/news/slots/:slotId — assign article to slot */
    @Patch(':slotId')
    assignArticle(
        @Param('slotId') slotId: string,
        @Body() body: any,
        @Req() req: Request & { user?: { id?: string } },
    ) {
        return this.slotsService.assignArticleToSlot(slotId, body, req.user?.id);
    }

    /** POST /admin/news/slots/:slotId/publish — publish slot's article */
    @Post(':slotId/publish')
    @HttpCode(HttpStatus.OK)
    publishSlot(@Param('slotId') slotId: string) {
        return this.slotsService.publishSlot(slotId);
    }

    /** POST /admin/news/slots/:slotId/unpublish — unpublish slot's article */
    @Post(':slotId/unpublish')
    @HttpCode(HttpStatus.OK)
    unpublishSlot(@Param('slotId') slotId: string) {
        return this.slotsService.unpublishSlot(slotId);
    }

    /** PATCH /admin/news/slots/:slotId/toggle-active — toggle slot active state */
    @Patch(':slotId/toggle-active')
    toggleSlotActive(@Param('slotId') slotId: string) {
        return this.slotsService.toggleSlotActive(slotId);
    }

    /** GET /admin/news/slots/:slotId/history — change history for a slot */
    @Get(':slotId/history')
    getSlotHistory(@Param('slotId') slotId: string) {
        return this.slotsService.getSlotHistory(slotId);
    }

    /** POST /admin/news/slots/seed — manually trigger seed */
    @Post('seed')
    @HttpCode(HttpStatus.OK)
    seed() {
        return this.slotsService.seedCategoriesAndSlots();
    }
}
