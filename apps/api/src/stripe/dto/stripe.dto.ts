import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCommunityPaymentDto {
    @IsString()
    @IsNotEmpty()
    planId: string;
}
