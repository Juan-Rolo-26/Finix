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

    getAppUrl() {
        return (process.env.FRONTEND_URL || process.env.APP_URL || 'https://finixarg.com').replace(/\/$/, '');
    }

    getAdminUrl() {
        return (process.env.ADMIN_URL || 'https://admin.finixarg.com').replace(/\/$/, '');
    }

    getAdminNotificationEmail() {
        return process.env.ADMIN_OWNER_EMAIL?.trim() || 'juanpablorolo2007@gmail.com';
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

    async sendEmail(params: {
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

    async sendAdmin2faCode(email: string, code: string) {
        return this.sendCodeEmail({
            email,
            code,
            subject: `Tu código de verificación por email - Admin Finix: ${code}`,
            title: 'Acceso Admin (verificación por email)',
            description: 'Se ha solicitado acceso al panel de administración de Finix. Este es tu código de verificación por email:',
            footer: 'Si no solicitaste este acceso, repórtalo de inmediato. El código expira en 10 minutos.',
            ctaLabel: 'Abrir Admin Finix',
            ctaUrl: this.getAdminUrl(),
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

    async sendProInvestmentEmail(
        email: string,
        params: {
            username?: string | null;
            subject: string;
            title: string;
            message: string;
            imageUrl?: string | null;
            ctaLabel?: string | null;
            ctaUrl?: string | null;
        },
    ) {
        const safeUsername = this.escapeHtml(params.username || 'inversor');
        const safeTitle = this.escapeHtml(params.title);
        const safeMessage = this.escapeHtml(params.message).replace(/\n/g, '<br />');
        const safeImageUrl = params.imageUrl ? this.escapeHtml(params.imageUrl) : '';
        const safeCtaLabel = this.escapeHtml(params.ctaLabel || 'Ver en Finix');
        const targetUrl = params.ctaUrl || this.getAppUrl();
        const safeTargetUrl = this.escapeHtml(targetUrl);
        const settingsUrl = this.escapeHtml(`${this.getAppUrl()}/settings?tab=notificaciones`);

        return this.sendEmail({
            to: email,
            subject: params.subject,
            text: [
                `Hola ${params.username || 'inversor'},`,
                '',
                params.title,
                '',
                params.message,
                '',
                `${params.ctaLabel || 'Ver en Finix'}: ${targetUrl}`,
                '',
                `Recibís este email porque activaste las notificaciones de inversión Finix PRO. Podés cambiarlas en: ${this.getAppUrl()}/settings?tab=notificaciones`,
            ].join('\n'),
            html: `
                <div style="margin:0;padding:32px 16px;background:#f4f7f6;font-family:Arial,sans-serif;color:#12211c;">
                    <table align="center" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dce8e1;">
                        <tr><td style="padding:24px 28px;background:#0d2a1c;color:#ffffff;">
                            <span style="font-size:20px;font-weight:800;letter-spacing:.08em;">FINIX</span>
                            <span style="margin-left:10px;font-size:11px;color:#9ee6be;font-weight:700;letter-spacing:.08em;">PRO INVERSIÓN</span>
                        </td></tr>
                        ${safeImageUrl ? `<tr><td><img src="${safeImageUrl}" alt="" width="620" style="display:block;width:100%;max-height:260px;object-fit:cover;border:0;" /></td></tr>` : ''}
                        <tr><td style="padding:30px 28px 24px;">
                            <p style="margin:0 0 12px;font-size:14px;color:#537061;">Hola ${safeUsername},</p>
                            <h1 style="margin:0 0 16px;font-size:27px;line-height:1.25;color:#10251a;">${safeTitle}</h1>
                            <p style="margin:0;font-size:15px;line-height:1.7;color:#40564a;">${safeMessage}</p>
                            <a href="${safeTargetUrl}" style="display:inline-block;margin-top:24px;padding:13px 20px;border-radius:10px;background:#16a36a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">${safeCtaLabel} &rarr;</a>
                        </td></tr>
                        <tr><td style="padding:18px 28px;background:#f7faf8;border-top:1px solid #e2ebe5;">
                            <p style="margin:0;font-size:11px;line-height:1.6;color:#6b7f73;">Recibís este correo porque activaste las notificaciones de inversión de Finix PRO. <a href="${settingsUrl}" style="color:#168b5a;">Administrar preferencias</a>.</p>
                        </td></tr>
                    </table>
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

    private renderAdminAlertEmail(
        params: {
            title: string;
            badgeText: string;
            badgeColor?: string;
            summary: string;
            details: Array<{ label: string; value: string | number }>;
            actionUrl?: string;
            actionLabel?: string;
        },
        destination: string,
    ) {
        const badgeColor = params.badgeColor || '#10b981';
        const badgeBg = `${badgeColor}22`;
        const badgeBorder = `${badgeColor}55`;

        const detailRows = (params.details || [])
            .map(
                (d) => `
                <tr>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; font-size: 12px; font-weight: 600; color: #94a3b8; width: 32%; vertical-align: top;">
                        ${this.escapeHtml(d.label)}
                    </td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; font-size: 13px; font-weight: 500; color: #f8fafc; vertical-align: top; word-break: break-word;">
                        ${this.escapeHtml(String(d.value))}
                    </td>
                </tr>
            `,
            )
            .join('');

        const actionButtonHtml = params.actionUrl
            ? `
            <div style="margin-top: 24px; text-align: left;">
                <a
                    href="${this.escapeHtml(params.actionUrl)}"
                    style="display: inline-block; padding: 12px 22px; border-radius: 10px; background: #10b981; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);"
                >
                    ${this.escapeHtml(params.actionLabel || 'Ver en Finix')} &rarr;
                </a>
            </div>
        `
            : '';

        return `
            <div style="background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px 16px; color: #f1f5f9;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
                    <tr>
                        <td style="padding: 20px 24px; border-bottom: 1px solid #1f2937; background: linear-gradient(180deg, #182234 0%, #111827 100%);">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.03em; color: #ffffff;">FINIX</span>
                                        <span style="display: inline-block; margin-left: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; font-weight: 600;">Control Center</span>
                                    </td>
                                    <td align="right">
                                        <span style="display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
                                            ${this.escapeHtml(params.badgeText)}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 28px;">
                            <h1 style="margin: 0 0 10px; font-size: 19px; font-weight: 700; color: #f8fafc; line-height: 1.35;">
                                ${this.escapeHtml(params.title)}
                            </h1>
                            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                                ${this.escapeHtml(params.summary)}
                            </p>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0d131f; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
                                ${detailRows}
                            </table>
                            ${actionButtonHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 18px 24px; background-color: #0a0e17; border-top: 1px solid #1f2937; text-align: center;">
                            <p style="margin: 0 0 4px; font-size: 12px; color: #64748b;">
                                Alerta enviada a <strong style="color: #94a3b8;">${this.escapeHtml(destination)}</strong>
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #475569;">
                                Finix Platform © ${new Date().getFullYear()} — Plataforma de Mercados y Comunidad
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        `;
    }

    async sendAdminAlert(options: {
        eventType:
            | 'USER_REGISTERED'
            | 'REPORT_CREATED'
            | 'POST_CREATED'
            | 'COMMUNITY_CREATED'
            | 'CREATOR_APPLICATION'
            | 'PAYMENT_RECEIVED'
            | 'CONTACT_MESSAGE';
        title: string;
        badgeText: string;
        badgeColor?: string;
        summary: string;
        details: Array<{ label: string; value: string | number }>;
        actionUrl?: string;
        actionLabel?: string;
    }): Promise<void> {
        try {
            const destination = this.getAdminNotificationEmail();
            const subject = `[Finix] ${options.badgeText}: ${options.title}`;

            const textLines = [
                `FINIX - NOTIFICACIÓN ADMINISTRATIVA`,
                `[${options.badgeText}] ${options.title}`,
                '',
                options.summary,
                '',
                ...(options.details || []).map((d) => `${d.label}: ${d.value}`),
            ];
            if (options.actionUrl) {
                textLines.push('', `${options.actionLabel || 'Ver en Finix'}: ${options.actionUrl}`);
            }

            const html = this.renderAdminAlertEmail(options, destination);

            await this.sendEmail({
                to: destination,
                subject,
                text: textLines.join('\n'),
                html,
            });

            this.logger.log(`Admin alert [${options.eventType}] sent to ${destination}`);
        } catch (error: any) {
            this.logger.error(`Error sending admin alert [${options.eventType}]: ${error?.message || error}`);
        }
    }
}
