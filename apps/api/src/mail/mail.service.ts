import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor() {
        // En desarrollo/producción es mejor usar variables de entorno
        // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'example@ethereal.email',
                pass: process.env.SMTP_PASS || 'password',
            },
        });
    }

    async sendVerificationCode(email: string, code: string) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"Finix" <no-reply@finix.com>',
                to: email,
                subject: 'Verifica tu cuenta en Finix',
                text: `Tu código de verificación es: ${code}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <h2>Verifica tu cuenta</h2>
                        <p>Gracias por unirte a Finix. Tu código de verificación es:</p>
                        <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
                        <p>Este código expira en 15 minutos.</p>
                    </div>
                `,
            });
            this.logger.log(`Verification email sent to ${email}: ${info.messageId}`);
            // if using ethereal, log the URL to view the email
            if (process.env.SMTP_HOST === undefined || process.env.SMTP_HOST?.includes('ethereal')) {
                this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        } catch (error: any) {
            const errMsg = error?.response || error?.message || '';
            if (!errMsg.includes('550')) {
                this.logger.error(`Error sending verification email: ${error}`);
            }
            throw error;
        }
    }

    async sendPasswordResetLink(email: string, token: string) {
        try {
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"Finix" <no-reply@finix.com>',
                to: email,
                subject: 'Restablecer contraseña en Finix',
                text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${resetLink}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <h2>Restablecer contraseña</h2>
                        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
                        <p>Si no fuiste tú, ignora este correo. El enlace expira en 1 hora.</p>
                    </div>
                `,
            });
            this.logger.log(`Password reset email sent to ${email}: ${info.messageId}`);
            if (process.env.SMTP_HOST === undefined || process.env.SMTP_HOST?.includes('ethereal')) {
                this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        } catch (error: any) {
            const errMsg = error?.response || error?.message || '';
            if (!errMsg.includes('550')) {
                this.logger.error(`Error sending password reset email: ${error}`);
            }
            throw error;
        }
    }
}
