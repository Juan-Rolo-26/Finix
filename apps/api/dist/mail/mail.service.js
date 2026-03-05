"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'example@ethereal.email',
                pass: process.env.SMTP_PASS || 'password',
            },
        });
    }
    async sendVerificationCode(email, code) {
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
            if (process.env.SMTP_HOST === undefined || process.env.SMTP_HOST?.includes('ethereal')) {
                this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        }
        catch (error) {
            const errMsg = error?.response || error?.message || '';
            if (!errMsg.includes('550')) {
                this.logger.error(`Error sending verification email: ${error}`);
            }
            throw error;
        }
    }
    async sendPasswordResetLink(email, token) {
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
        }
        catch (error) {
            const errMsg = error?.response || error?.message || '';
            if (!errMsg.includes('550')) {
                this.logger.error(`Error sending password reset email: ${error}`);
            }
            throw error;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map