import { BadRequestException, Body, Controller, ForbiddenException, HttpCode, HttpStatus, Logger, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { NewsletterSubscribeDto } from './dto/newsletter-subscribe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('newsletter')
export class NewsletterController {
    private readonly logger = new Logger(NewsletterController.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('subscribe')
    @HttpCode(HttpStatus.OK)
    async subscribe(@Body() dto: NewsletterSubscribeDto, @Req() req: Request & { user?: { id: string } }) {
        if (!req.user?.id) throw new UnauthorizedException('Iniciá sesión para activar el boletín.');
        const email = dto.email.trim().toLowerCase();

        // 1. Verify user exists and is registered (subscription requires registration)
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, emailVerified: true, status: true },
        });

        if (!user) throw new UnauthorizedException('Iniciá sesión para activar el boletín.');
        if (user.email.toLowerCase() !== email) {
            throw new ForbiddenException('El boletín se activa únicamente para el correo de tu cuenta.');
        }
        if (!user.emailVerified || user.status !== 'ACTIVE') {
            throw new ForbiddenException('Verificá el correo de tu cuenta antes de activar el boletín.');
        }

        // 2. Record subscription in PlatformSetting for persistence
        const key = `newsletter.sub.${email}`;
        await this.prisma.platformSetting.upsert({
            where: { key },
            create: {
                key,
                value: JSON.stringify({
                    email,
                    userId: user.id,
                    subscribedAt: new Date().toISOString(),
                    source: 'home_landing',
                    status: 'ACTIVE',
                }),
                description: 'Suscripción al boletín financiero desde la home',
            },
            update: {
                value: JSON.stringify({
                    email,
                    userId: user.id,
                    subscribedAt: new Date().toISOString(),
                    source: 'home_landing',
                    status: 'ACTIVE',
                }),
            },
        });

        // 3. Opt them in to daily newsletter preferences
        await this.prisma.emailPreference.upsert({
            where: { userId: user.id },
            create: { userId: user.id, marketing: true, daily: true, weekly: true },
            update: { marketing: true, daily: true, weekly: true },
        });

        // 4. Compose welcome newsletter email
        const appUrl = (process.env.FRONTEND_URL || 'https://finixarg.com').replace(/\/$/, '');
        const subject = '¡Bienvenido al Boletín Financiero de Finix! 📈';
        const text = `¡Hola! Confirmamos tu suscripción al Boletín Diario de Mercados de Finix.\n\nA partir de hoy vas a recibir directamente en tu casilla el resumen diario de cotizaciones (Dólar MEP, CCL, Merval, Wall Street y Cripto), análisis de noticias financieras y el calendario económico.\n\nExplorá la plataforma en vivo: ${appUrl}\n\nFinix · Información y análisis financiero independiente.`;

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="background: linear-gradient(135deg, #065f46 0%, #059669 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
        <div style="display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.18); border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">
          FINIX · BOLETÍN OFICIAL
        </div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; line-height: 1.25; letter-spacing: -0.02em;">¡Suscripción Confirmada! 📈</h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: #d1fae5; line-height: 1.5;">El resumen de mercados que necesitás, todos los días en tu casilla</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px 24px;">
        <p style="font-size: 15px; line-height: 1.6; color: #1e293b; margin: 0 0 16px;">
          ¡Hola! Tu correo <strong>${email}</strong> quedó registrado para recibir el <strong>Boletín Diario de Finix</strong> al cierre de cada rueda financiera.
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin: 24px 0;">
          <h2 style="color: #166534; margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800;">
            ¿Qué vas a recibir en cada edición?
          </h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px; line-height: 1.7; color: #166534;">
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 24px;">💵</td>
              <td style="padding: 4px 0;"><strong>Dólar en tiempo real:</strong> Mayorista, Oficial, MEP, CCL y Cripto.</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 24px;">📊</td>
              <td style="padding: 4px 0;"><strong>Acciones & CEDEARs:</strong> Las mayores subas, bajas y balances corporativos.</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 24px;">📰</td>
              <td style="padding: 4px 0;"><strong>Noticias Clave:</strong> Selección de noticias que mueven el mercado explicadas en minutos.</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 24px;">🗓️</td>
              <td style="padding: 4px 0;"><strong>Agenda Económica:</strong> Fechas clave de inflación, tasas y balances del S&P 500.</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
          No te llenamos de spam ni publicidad invasiva: solo datos financieros claros, accionables y verificados.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${appUrl}" style="background-color: #059669; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
            Ir a Finix en Vivo →
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
        <strong style="color: #334155;">Finix Argentina</strong> · Plataforma de información e inteligencia financiera.<br />
        Recibiste este correo porque te suscribiste desde <a href="${appUrl}" style="color: #059669; text-decoration: none; font-weight: 600;">finixarg.com</a>.<br />
        Si no solicitaste este mensaje, podés ignorarlo o desuscribirte cuando quieras.
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        // 4. Send email via standard mailService
        let sent = false;
        try {
            await this.mailService.sendEmail({
                to: email,
                subject,
                text,
                html,
                idempotencyKey: `finix:newsletter-welcome:${user.id}:${new Date().toISOString().slice(0, 10)}`,
            });
            sent = true;
        } catch (err) {
            this.logger.warn(`Fallo al enviar correo mediante mailService: ${(err as Error).message}`);
        }


        return {
            success: true,
            message: sent
                ? `¡Listo! Te enviamos un correo de confirmación a ${email}. Revisá tu casilla.`
                : 'Tu suscripción quedó activada. No pudimos enviar el correo de bienvenida; podés revisar tus preferencias en Configuración.',
        };
    }
}
