import { IsNotEmpty, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

/**
 * DTO for free-form web-aware AI analysis.
 * The user can ask anything — the AI will search the web and respond intelligently.
 */
export class WebAnalysisDto {
    /** The question, topic, or query the user wants the AI to analyze */
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    query: string;

    /** Optional: context or extra instructions */
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    context?: string;

    /** Override AI model (optional) */
    @IsOptional()
    @IsString()
    model?: string;

    /** Whether to include raw web results in response (default: false) */
    @IsOptional()
    @IsBoolean()
    includeSearchResults?: boolean;
}

/**
 * DTO for stock/asset analysis enriched with live web data.
 */
export class AssetWebAnalysisDto {
    @IsString()
    @IsNotEmpty()
    ticker: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    question?: string;

    @IsOptional()
    @IsString()
    model?: string;
}
