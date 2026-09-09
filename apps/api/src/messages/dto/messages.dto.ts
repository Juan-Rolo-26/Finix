import { IsString, IsOptional, IsEnum, IsObject, ValidateNested, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageAttachmentDto {
    @IsEnum(['image', 'post', 'chart', 'story'])
    type: 'image' | 'post' | 'chart' | 'story';

    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsString()
    postId?: string;

    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;
}

export class SendMessageDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => MessageAttachmentDto)
    attachment?: MessageAttachmentDto | null;
}

export class CreateConversationDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(20)
    userIds?: string[];

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
