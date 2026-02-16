import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    mediaUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tickers?: string[];
}

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    mediaUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tickers?: string[];
}
