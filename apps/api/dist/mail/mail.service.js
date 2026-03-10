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
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    getAppUrl() {
        return (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    }
    async sendCodeEmail(params) {
        const { email, code, subject, title, description, footer } = params;
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"Finix" <no-reply@finix.com>',
                to: email,
                subject,
                text: `${description}\n\nCodigo: ${code}\n\n${footer}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <h2>${title}</h2>
                        <p>${description}</p>
                        <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
                        <p>${footer}</p>
                    </div>
                `,
            });
            this.logger.log(`Code email sent to ${email}: ${info.messageId}`);
            if (process.env.SMTP_HOST === undefined || process.env.SMTP_HOST?.includes('ethereal')) {
                this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        }
        catch (error) {
            const errMsg = error?.response || error?.message || '';
            if (typeof errMsg === 'string' &&
                (errMsg.includes('You can only send testing emails to your own email address') ||
                    errMsg.includes('verify a domain at resend.com/domains'))) {
                throw new common_1.BadRequestException('El mail de Finix está en modo prueba. Para enviar códigos a cualquier usuario hay que verificar un dominio en Resend y usarlo en EMAIL_FROM.');
            }
            if (!errMsg.includes('550')) {
                this.logger.error(`Error sending auth code email: ${error}`);
            }
            throw error;
        }
    }
    async sendVerificationCode(email, code) {
        return this.sendCodeEmail({
            email,
            code,
            subject: 'Verifica tu cuenta en Finix',
            title: 'Verifica tu cuenta',
            description: 'Gracias por unirte a Finix. Este es tu codigo de verificacion:',
            footer: 'Este codigo expira en 15 minutos.',
        });
    }
    async sendLoginCode(email, code) {
        return this.sendCodeEmail({
            email,
            code,
            subject: 'Codigo de acceso a Finix',
            title: 'Confirma tu inicio de sesion',
            description: 'Usa este codigo para terminar de iniciar sesion en Finix:',
            footer: 'Si no intentaste ingresar, ignora este correo. El codigo expira en 10 minutos.',
        });
    }
    async sendPasswordResetCode(email, code) {
        return this.sendCodeEmail({
            email,
            code,
            subject: 'Codigo para restablecer tu contrasena en Finix',
            title: 'Restablece tu contrasena',
            description: 'Usa este codigo para crear una nueva contrasena en Finix:',
            footer: 'Si no fuiste vos, ignora este correo. El codigo expira en 15 minutos.',
        });
    }
    async sendNotificationEmail(email, params) {
        const safeTitle = this.escapeHtml(params.title);
        const safeContent = params.content ? this.escapeHtml(params.content) : '';
        const safeUsername = params.username ? this.escapeHtml(params.username) : 'inversor';
        const appUrl = this.getAppUrl();
        const targetLink = params.link
            ? (/^https?:\/\//i.test(params.link) ? params.link : `${appUrl}${params.link.startsWith('/') ? params.link : `/${params.link}`}`)
            : appUrl;
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"Finix" <no-reply@finix.com>',
                to: email,
                subject: 'Nueva notificacion en Finix',
                text: [
                    `Hola ${params.username || 'inversor'},`,
                    '',
                    params.title,
                    params.content || '',
                    '',
                    `Ver en Finix: ${targetLink}`,
                ].filter(Boolean).join('\n'),
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #0f172a;">
                        <p style="font-size: 14px; color: #475569;">Hola ${safeUsername},</p>
                        <h2 style="margin-bottom: 12px;">${safeTitle}</h2>
                        ${safeContent ? `<p style="font-size: 14px; line-height: 1.6; color: #334155;">${safeContent}</p>` : ''}
                        <a
                            href="${this.escapeHtml(targetLink)}"
                            style="display: inline-block; margin-top: 16px; padding: 10px 16px; border-radius: 10px; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: 600;"
                        >
                            Ver notificacion
                        </a>
                    </div>
                `,
            });
            this.logger.log(`Notification email sent to ${email}: ${info.messageId}`);
            if (process.env.SMTP_HOST === undefined || process.env.SMTP_HOST?.includes('ethereal')) {
                this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        }
        catch (error) {
            const errMsg = error?.response || error?.message || '';
            if (typeof errMsg === 'string' &&
                (errMsg.includes('You can only send testing emails to your own email address') ||
                    errMsg.includes('verify a domain at resend.com/domains'))) {
                throw new common_1.BadRequestException('El mail de Finix está en modo prueba. Para enviar notificaciones a cualquier usuario hay que verificar un dominio en Resend y usarlo en EMAIL_FROM.');
            }
            this.logger.error(`Error sending notification email: ${error}`);
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