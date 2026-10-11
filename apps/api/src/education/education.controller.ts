import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { EducationService } from './education.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { CreateCategoryDto, CreateSubcategoryDto } from './dto/category.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('education')
export class EducationController {
    constructor(private readonly educationService: EducationService) {}

    // ─── ENDPOINTS PÚBLICOS ──────────────────────────────────────────────────

    @Get('categories')
    async getCategories() {
        return this.educationService.getCategories();
    }

    @Get('categories/:slug')
    async getCategoryBySlug(@Param('slug') slug: string) {
        return this.educationService.getCategoryBySlug(slug);
    }

    @Get('articles')
    async getArticles(
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('subcategory') subcategory?: string,
        @Query('level') level?: string,
        @Query('featured') featured?: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        return this.educationService.getArticles({
            search,
            category,
            subcategory,
            level,
            featured: featured === 'true' || featured === '1',
            limit: limit ? Number(limit) : undefined,
            page: page ? Number(page) : undefined,
        });
    }

    @Get('glossary')
    async getGlossaryMap() {
        return this.educationService.getGlossaryMap();
    }

    @Get('learning-paths')
    @UseGuards(OptionalJwtAuthGuard)
    async getLearningPaths(@Req() req: any) {
        return this.educationService.getLearningPaths(req.user?.id);
    }

    @Get('learning-paths/:slug')
    @UseGuards(OptionalJwtAuthGuard)
    async getLearningPathBySlug(@Param('slug') slug: string, @Req() req: any) {
        return this.educationService.getLearningPathBySlug(slug, req.user?.id);
    }

    @Get('articles/:slug')
    @UseGuards(OptionalJwtAuthGuard)
    async getArticleBySlug(@Param('slug') slug: string, @Req() req: any) {
        return this.educationService.getArticleBySlug(slug, req.user?.id);
    }

    // ─── PROGRESO DE USUARIO (REQUIERE SESIÓN) ───────────────────────────────

    @Post('articles/:slug/progress')
    @UseGuards(JwtAuthGuard)
    async updateProgress(
        @Param('slug') slug: string,
        @Body() body: { isCompleted?: boolean },
        @Req() req: any,
    ) {
        return this.educationService.updateUserProgress(
            req.user.id,
            slug,
            Boolean(body.isCompleted),
        );
    }

    @Get('user-progress')
    @UseGuards(JwtAuthGuard)
    async getUserProgress(@Req() req: any) {
        return this.educationService.getUserProgress(req.user.id);
    }

    // ─── GESTIÓN ADMIN (REQUIERE ADMIN GUARD) ────────────────────────────────

    @Get('admin/articles')
    @UseGuards(AdminGuard)
    async adminGetArticles(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('categoryId') categoryId?: string,
        @Query('level') level?: string,
    ) {
        return this.educationService.adminGetArticles({
            search,
            status,
            categoryId,
            level,
        });
    }

    @Post('admin/articles')
    @UseGuards(AdminGuard)
    async adminCreateArticle(@Body() dto: CreateArticleDto, @Req() req: any) {
        return this.educationService.adminCreateArticle(req.user?.id, dto);
    }

    @Put('admin/articles/:id')
    @UseGuards(AdminGuard)
    async adminUpdateArticle(
        @Param('id') id: string,
        @Body() dto: UpdateArticleDto,
    ) {
        return this.educationService.adminUpdateArticle(id, dto);
    }

    @Delete('admin/articles/:id')
    @UseGuards(AdminGuard)
    async adminDeleteArticle(@Param('id') id: string) {
        return this.educationService.adminDeleteArticle(id);
    }

    @Post('admin/categories')
    @UseGuards(AdminGuard)
    async adminCreateCategory(@Body() dto: CreateCategoryDto) {
        return this.educationService.adminCreateCategory(dto);
    }

    @Post('admin/subcategories')
    @UseGuards(AdminGuard)
    async adminCreateSubcategory(@Body() dto: CreateSubcategoryDto) {
        return this.educationService.adminCreateSubcategory(dto);
    }
}
