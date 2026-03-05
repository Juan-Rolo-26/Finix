import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FundamentalOrchestratorService } from '../services/fundamental-orchestrator.service';
import { FundamentalProviderId } from '../types/provider.types';

function toProvider(value: string | undefined): FundamentalProviderId {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'finnhub') return 'finnhub';
    if (normalized === 'alphavantage' || normalized === 'alpha' || normalized === 'alpha-vantage') return 'alphavantage';
    if (normalized === 'investing') return 'investing';
    if (normalized === 'polygon') return 'polygon';
    return 'fmp';
}

function toBoolean(value: unknown, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (['1', 'true', 'yes', 'y'].includes(lower)) return true;
        if (['0', 'false', 'no', 'n'].includes(lower)) return false;
    }
    return defaultValue;
}

@UseGuards(JwtAuthGuard)
@Controller('fundamental')
export class FundamentalController {
    constructor(private readonly orchestrator: FundamentalOrchestratorService) {}

    @Get('providers')
    getProviders() {
        return this.orchestrator.getProviders();
    }

    @Get('search')
    async search(@Query() query: any) {
        const text = String(query?.query || query?.q || query?.text || '').trim();
        const limit = Number(query?.limit || 20);
        return this.orchestrator.search(text, Number.isFinite(limit) ? limit : 20);
    }

    @Get(':ticker')
    async getFundamentals(@Param('ticker') ticker: string, @Query() query: any) {
        return this.orchestrator.getFundamentals({
            ticker: ticker.toUpperCase(),
            provider: toProvider(query?.provider),
            fallback: toBoolean(query?.fallback, true),
            forceRefresh: toBoolean(query?.force, false),
            tvSymbol: typeof query?.tvSymbol === 'string' ? query.tvSymbol : undefined,
        });
    }

    @Post(':ticker/refresh')
    async refreshFundamentals(@Param('ticker') ticker: string, @Query() query: any) {
        return this.orchestrator.refreshFundamentals({
            ticker: ticker.toUpperCase(),
            provider: toProvider(query?.provider),
            fallback: toBoolean(query?.fallback, true),
            forceRefresh: true,
            tvSymbol: typeof query?.tvSymbol === 'string' ? query.tvSymbol : undefined,
        });
    }
}
