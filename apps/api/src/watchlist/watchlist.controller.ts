import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    Res,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WatchlistService } from './watchlist.service';
import {
    CreateWatchlistDto,
    UpdateWatchlistDto,
    AddWatchlistItemDto,
    UpdateWatchlistItemDto,
    AddNoteDto,
    BatchImportDto,
    MoveCopyItemDto,
    ResolveSymbolsDto,
    FollowIdeaDto,
} from './dto/watchlist.dto';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
    constructor(private readonly watchlistService: WatchlistService) { }

    // ── 1. Listas del usuario ──
    @Get()
    async getWatchlists(@Req() req: any) {
        return this.watchlistService.getWatchlists(req.user.id);
    }

    // ── 2. Crear lista ──
    @Post()
    async createWatchlist(@Req() req: any, @Body() dto: CreateWatchlistDto) {
        return this.watchlistService.createWatchlist(req.user.id, dto);
    }

    // ── 3. Ideas automáticas para explorar ──
    @Get('ideas')
    async getIdeas(@Req() req: any) {
        return this.watchlistService.getIdeas(req.user.id);
    }

    @Post('ideas/follow')
    async toggleFollowIdea(@Req() req: any, @Body() dto: FollowIdeaDto) {
        return this.watchlistService.toggleFollowIdea(req.user.id, dto.category);
    }

    // ── 4. Resolver símbolos ambiguos ──
    @Post('resolve-symbols')
    async resolveSymbols(@Body() dto: ResolveSymbolsDto) {
        return this.watchlistService.resolveSymbols(dto.symbols);
    }

    // ── 5. Pertenencia de un activo en listas (para modal «Agregar a Seguimiento») ──
    @Get('membership/:symbol')
    async getUserListsForSymbol(@Req() req: any, @Param('symbol') symbol: string) {
        return this.watchlistService.getUserListsForSymbol(req.user.id, symbol);
    }

    // ── 6. Publicaciones comunitarias sobre un activo ──
    @Get('posts/:symbol')
    async getPublicCommunityPosts(@Param('symbol') symbol: string) {
        return this.watchlistService.getPublicCommunityPosts(symbol);
    }

    // ── 7. Mover o copiar activos entre listas ──
    @Post('move-copy')
    async moveCopyItem(@Req() req: any, @Body() dto: MoveCopyItemDto) {
        return this.watchlistService.moveCopyItem(req.user.id, dto);
    }

    // ── 8. Detalle enriquecido de una lista ──
    @Get(':id')
    async getWatchlistDetail(@Req() req: any, @Param('id') id: string) {
        return this.watchlistService.getWatchlistDetail(req.user.id, id);
    }

    // ── 9. Impacto antes de eliminar lista ──
    @Get(':id/delete-impact')
    async getDeleteImpact(@Req() req: any, @Param('id') id: string) {
        return this.watchlistService.getDeleteImpact(req.user.id, id);
    }

    // ── 10. Actualizar lista ──
    @Patch(':id')
    async updateWatchlist(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateWatchlistDto,
    ) {
        return this.watchlistService.updateWatchlist(req.user.id, id, dto);
    }

    // ── 11. Eliminar lista ──
    @Delete(':id')
    async deleteWatchlist(@Req() req: any, @Param('id') id: string) {
        return this.watchlistService.deleteWatchlist(req.user.id, id);
    }

    // ── 12. Agregar ítem a lista ──
    @Post(':id/items')
    async addItem(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: AddWatchlistItemDto,
    ) {
        return this.watchlistService.addItem(req.user.id, id, dto);
    }

    // ── 13. Importación en lote (CSV / Tickers) ──
    @Post(':id/batch-import')
    async batchImport(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: BatchImportDto,
    ) {
        return this.watchlistService.batchImport(req.user.id, id, dto);
    }

    // ── 14. Exportar lista (CSV o JSON) ──
    @Get(':id/export')
    async exportWatchlist(
        @Req() req: any,
        @Param('id') id: string,
        @Query('format') format: string,
        @Res() res: Response,
    ) {
        const fileFormat = format === 'json' ? 'json' : 'csv';
        const result = await this.watchlistService.exportWatchlist(req.user.id, id, fileFormat);

        if (fileFormat === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="watchlist_${id}.csv"`);
            return res.status(HttpStatus.OK).send(result);
        }

        return res.status(HttpStatus.OK).json(result);
    }

    // ── 15. Actualizar ítem (Objetivo, estado, tags, etc.) ──
    @Patch(':id/items/:itemId')
    async updateItem(
        @Req() req: any,
        @Param('id') id: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateWatchlistItemDto,
    ) {
        return this.watchlistService.updateItem(req.user.id, id, itemId, dto);
    }

    // ── 16. Quitar ítem de lista ──
    @Delete(':id/items/:itemId')
    async removeItem(
        @Req() req: any,
        @Param('id') id: string,
        @Param('itemId') itemId: string,
    ) {
        return this.watchlistService.removeItem(req.user.id, id, itemId);
    }

    // ── 17. Agregar nota a un ítem ──
    @Post('items/:itemId/notes')
    async addNote(
        @Req() req: any,
        @Param('itemId') itemId: string,
        @Body() dto: AddNoteDto,
    ) {
        return this.watchlistService.addNote(req.user.id, itemId, dto);
    }

    // ── 18. Eliminar nota ──
    @Delete('notes/:noteId')
    async deleteNote(@Req() req: any, @Param('noteId') noteId: string) {
        return this.watchlistService.deleteNote(req.user.id, noteId);
    }
}
