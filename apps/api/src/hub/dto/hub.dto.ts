import { IsString, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';

export class CreateChannelDto {
    @IsString() slug: string;
    @IsString() name: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsString() icon?: string;
    @IsOptional() @IsString() @IsIn(['CHAT', 'FEED']) type?: string;
    @IsOptional() @IsNumber() order?: number;
}

export class UpdateChannelDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsString() icon?: string;
    @IsOptional() @IsString() @IsIn(['CHAT', 'FEED']) type?: string;
    @IsOptional() @IsNumber() order?: number;
}

export class CreateMessageDto {
    @IsString() content: string;
    @IsOptional() @IsString() mediaUrl?: string;
}

export class CreatePostDto {
    @IsString() content: string;
    @IsOptional() @IsString() title?: string;
    @IsOptional() @IsString() mediaUrl?: string;
}

export class CreateCommentDto {
    @IsString() content: string;
}

export class CreateEventDto {
    @IsString() title: string;
    @IsOptional() @IsString() description?: string;
    @IsString() startsAt: string;
    @IsOptional() @IsString() endsAt?: string;
    @IsOptional() @IsString() link?: string;
}

export class CreateResourceDto {
    @IsString() title: string;
    @IsOptional() @IsString() description?: string;
    @IsString() url: string;
    @IsOptional()
    @IsString()
    @IsIn(['video', 'audio', 'pdf', 'image', 'article', 'link', 'file'])
    mediaType?: string;
    @IsOptional() @IsString() thumbnailUrl?: string;
    @IsOptional() @IsString() duration?: string;
    @IsOptional() @IsString() category?: string;
    @IsOptional() @IsNumber() order?: number;
}

export class PinDto {
    @IsBoolean() pinned: boolean;
}
