"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
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
    getResendApiKey() {
        const key = process.env.RESEND_API_KEY?.trim() || process.env.SMTP_PASS?.trim();
        if (!key) {
            throw new common_1.BadRequestException('Falta configurar RESEND_API_KEY para enviar correos desde Finix.');
        }
        return key;
    }
    getEmailFrom() {
        return process.env.EMAIL_FROM || 'Finix <onboarding@resend.dev>';
    }
    buildAppLink(path, searchParams) {
        const url = new URL(path, `${this.getAppUrl()}/`);
        if (searchParams) {
            Object.entries(searchParams).forEach(([key, value]) => {
                if (value) {
                    url.searchParams.set(key, value);
                }
            });
        }
        return url.toString();
    }
    renderCodeEmail(params) {
        const { title, description, code, footer, ctaLabel, ctaUrl } = params;
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
                <div style="margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: #16a34a; font-weight: 700;">Finix</p>
                    <h1 style="margin: 12px 0 0; font-size: 28px; line-height: 1.2;">${this.escapeHtml(title)}</h1>
                </div>
                <p style="font-size: 15px; line-height: 1.7; color: #334155;">${this.escapeHtml(description)}</p>
                <div style="margin: 28px 0; padding: 18px 20px; border-radius: 18px; background: #f8fafc; border: 1px solid #dbeafe; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #64748b;">Tu codigo</p>
                    <p style="margin: 0; font-size: 34px; letter-spacing: 0.35em; font-weight: 800; color: #16a34a;">${this.escapeHtml(code)}</p>
                </div>
                <a
                    href="${this.escapeHtml(ctaUrl)}"
                    style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700;"
                >
                    ${this.escapeHtml(ctaLabel)}
                </a>
                <p style="margin-top: 24px; font-size: 13px; line-height: 1.7; color: #64748b;">${this.escapeHtml(footer)}</p>
            </div>
        `;
    }
    async sendEmail(params) {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.getResendApiKey()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: this.getEmailFrom(),
                to: [params.to],
                subject: params.subject,
                text: params.text,
                html: params.html,
            }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const errorMessage = typeof body.message === 'string' ? body.message : 'No se pudo enviar el correo.';
            if (errorMessage.includes('verify a domain') ||
                errorMessage.includes('testing emails')) {
                throw new common_1.BadRequestException('El correo saliente de Finix todavia no esta listo para produccion. Verifica tu dominio en Resend y usalo en EMAIL_FROM.');
            }
            this.logger.error(`Error sending email with Resend: ${errorMessage}`);
            throw new common_1.BadRequestException(errorMessage);
        }
        this.logger.log(`Email sent to ${params.to}: ${body.id ?? 'without-id'}`);
        return body;
    }
    async sendCodeEmail(params) {
        const { email, code, subject, title, description, footer, ctaLabel, ctaUrl } = params;
        return this.sendEmail({
            to: email,
            subject,
            text: `${description}\n\nCodigo: ${code}\n\nAbrir Finix: ${ctaUrl}\n\n${footer}`,
            html: this.renderCodeEmail({
                title,
                description,
                code,
                footer,
                ctaLabel,
                ctaUrl,
            }),
        });
    }
    async sendVerificationCode(email, code) {
        const verifyUrl = this.buildAppLink('/verify-email', { email });
        return this.sendCodeEmail({
            email,
            code,
            subject: 'Verifica tu cuenta en Finix',
            title: 'Verifica tu cuenta',
            description: 'Gracias por unirte a Finix. Este es tu codigo de verificacion:',
            footer: 'Este codigo expira en 15 minutos.',
            ctaLabel: 'Abrir verificacion en Finix',
            ctaUrl: verifyUrl,
        });
    }
    async sendLoginCode(email, code) {
        const loginUrl = this.buildAppLink('/', { email });
        return this.sendCodeEmail({
            email,
            code,
            subject: 'Codigo de acceso a Finix',
            title: 'Confirma tu inicio de sesion',
            description: 'Usa este codigo para terminar de iniciar sesion en Finix:',
            footer: 'Si no intentaste ingresar, ignora este correo. El codigo expira en 10 minutos.',
            ctaLabel: 'Volver a Finix',
            ctaUrl: loginUrl,
        });
    }
    async sendPasswordResetCode(email, code) {
        const resetUrl = this.buildAppLink('/reset-password', { email });
        return this.sendCodeEmail({
            email,
            code,
            subject: 'Codigo para restablecer tu contrasena en Finix',
            title: 'Restablece tu contrasena',
            description: 'Usa este codigo para crear una nueva contrasena en Finix:',
            footer: 'Si no fuiste vos, ignora este correo. El codigo expira en 15 minutos.',
            ctaLabel: 'Restablecer en Finix',
            ctaUrl: resetUrl,
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
        return this.sendEmail({
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
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)()
], MailService);
//# sourceMappingURL=mail.service.js.map