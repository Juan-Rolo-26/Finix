import { IsNumber, Min } from 'class-validator';

export class PayoutRequestDto {
    @IsNumber()
    @Min(1)
    amount: number;
}

