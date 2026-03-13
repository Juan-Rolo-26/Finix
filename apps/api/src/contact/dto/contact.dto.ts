import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactDto {
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    name!: string;

    @IsEmail()
    @MaxLength(120)
    email!: string;

    @IsString()
    @MinLength(4)
    @MaxLength(140)
    subject!: string;

    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    message!: string;
}
