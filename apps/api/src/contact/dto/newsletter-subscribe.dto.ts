import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class NewsletterSubscribeDto {
    @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
    @IsEmail({}, { message: 'Ingresá un correo electrónico válido.' })
    @MaxLength(120)
    email!: string;
}
