import { BadRequestException, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    private escapeHtml(value: string) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private getAppUrl() {
        return (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    }

    private getResendApiKey() {
        const key = process.env.RESEND_API_KEY?.trim() || process.env.SMTP_PASS?.trim();
        if (!key) {
            throw new BadRequestException(
                'Falta configurar RESEND_API_KEY para enviar correos desde Finix.',
            );
        }
        return key;
    }

    private getEmailFrom() {
        return process.env.EMAIL_FROM || 'Finix <onboarding@resend.dev>';
    }

    private getContactEmailTo() {
        return process.env.CONTACT_EMAIL_TO?.trim() || 'finiixarg@gmail.com';
    }

    private buildAppLink(path: string, searchParams?: Record<string, string | undefined>) {
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

    private renderCodeEmail(params: {
        title: string;
        description: string;
        code: string;
        footer: string;
        ctaLabel: string;
        ctaUrl: string;
    }) {
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

    private async sendEmail(params: {
        to: string;
        subject: string;
        text: string;
        html: string;
        replyTo?: string;
    }) {
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
                reply_to: params.replyTo,
            }),
        });

        const body = await response.json().catch(() => ({} as { message?: string; id?: string }));
        if (!response.ok) {
            const errorMessage = typeof body.message === 'string' ? body.message : 'No se pudo enviar el correo.';
            if (
                errorMessage.includes('verify a domain') ||
                errorMessage.includes('testing emails')
            ) {
                throw new BadRequestException(
                    'El correo saliente de Finix todavia no esta listo para produccion. Verifica tu dominio en Resend y usalo en EMAIL_FROM.',
                );
            }
            this.logger.error(`Error sending email with Resend: ${errorMessage}`);
            throw new BadRequestException(errorMessage);
        }

        this.logger.log(`Email sent to ${params.to}: ${body.id ?? 'without-id'}`);
        return body;
    }

    private async sendCodeEmail(params: {
        email: string;
        code: string;
        subject: string;
        title: string;
        description: string;
        footer: string;
        ctaLabel: string;
        ctaUrl: string;
    }) {
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

    async sendVerificationCode(email: string, code: string) {
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

    async sendLoginCode(email: string, code: string) {
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

    async sendPasswordResetCode(email: string, code: string) {
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

    async sendNotificationEmail(
        email: string,
        params: {
            username?: string | null;
            title: string;
            content?: string | null;
            link?: string | null;
        },
    ) {
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

    async sendContactMessage(params: {
        name: string;
        email: string;
        subject: string;
        message: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        const safeName = this.escapeHtml(params.name);
        const safeEmail = this.escapeHtml(params.email);
        const safeSubject = this.escapeHtml(params.subject);
        const safeMessage = this.escapeHtml(params.message).replace(/\n/g, '<br />');
        const safeIpAddress = params.ipAddress ? this.escapeHtml(params.ipAddress) : 'unknown';
        const safeUserAgent = params.userAgent ? this.escapeHtml(params.userAgent) : 'unknown';
        const destination = this.getContactEmailTo();

        return this.sendEmail({
            to: destination,
            replyTo: params.email,
            subject: `[Contacto Finix] ${params.subject}`,
            text: [
                'Nuevo mensaje desde el formulario de contacto de Finix.',
                '',
                `Nombre: ${params.name}`,
                `Email: ${params.email}`,
                `Asunto: ${params.subject}`,
                '',
                params.message,
                '',
                `IP: ${params.ipAddress || 'unknown'}`,
                `User-Agent: ${params.userAgent || 'unknown'}`,
            ].join('\n'),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0f172a;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: #16a34a; font-weight: 700;">Finix Contacto</p>
                    <h1 style="margin: 12px 0 20px; font-size: 28px; line-height: 1.2;">${safeSubject}</h1>
                    <div style="padding: 18px 20px; border-radius: 18px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Nombre:</strong> ${safeName}</p>
                        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> ${safeEmail}</p>
                        <p style="margin: 0; font-size: 14px;"><strong>Asunto:</strong> ${safeSubject}</p>
                    </div>
                    <div style="padding: 20px; border-radius: 18px; background: #ffffff; border: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 10px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b;">Mensaje</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #334155;">${safeMessage}</p>
                    </div>
                    <div style="margin-top: 20px; font-size: 12px; line-height: 1.7; color: #64748b;">
                        <p style="margin: 0;"><strong>IP:</strong> ${safeIpAddress}</p>
                        <p style="margin: 4px 0 0;"><strong>User-Agent:</strong> ${safeUserAgent}</p>
                    </div>
                </div>
            `,
        });
    }
}
