import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import * as bodyParser from 'body-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { isAllowedOrigin } from './config/allowed-origins';
import helmet from 'helmet';

const logger = new Logger('Bootstrap');

async function bootstrap() {
    if (process.env.NODE_ENV === 'production') {
        const required = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL', 'ALLOWED_ORIGINS'];
        const missing = required.filter((name) => !process.env[name]?.trim());
        const weakJwt = !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'secretKey';
        if (missing.length || weakJwt) {
            throw new Error(`Configuración de producción inválida${missing.length ? `; faltan: ${missing.join(', ')}` : ''}${weakJwt ? '; JWT_SECRET debe tener al menos 32 caracteres' : ''}`);
        }
    }
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn', 'log']
            : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    // ── Body parsers ─────────────────────────────────────────────────────────
    // Stripe webhook MUST receive raw body for signature validation.
    app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
    app.use(bodyParser.json({ limit: '2mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
        hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }));

    // ── Validation ────────────────────────────────────────────────────────────
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // ── CORS ──────────────────────────────────────────────────────────────────
    app.enableCors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
                return;
            }
            logger.warn(`CORS blocked: ${origin}`);
            callback(new Error('CORS origin not allowed'));
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // ── Global prefix ─────────────────────────────────────────────────────────
    app.setGlobalPrefix('api', {
        // Exclude /health and /ready from /api prefix so Docker/k8s probes work
        exclude: ['health', 'ready'],
    });

    // ── Health check endpoints (before prefix) ────────────────────────────────
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        });
    });
    httpAdapter.get('/ready', async (_req, res) => {
        const prisma = app.get(PrismaService);
        const databaseReady = await prisma.isDatabaseReady();

        res.status(databaseReady ? 200 : 503).json({
            status: databaseReady ? 'ready' : 'not_ready',
            database: databaseReady ? 'connected' : 'unavailable',
        });
    });

    // ── Static uploads (local filesystem fallback — use R2/S3 in production) ──
    const express = require('express');
    const { getUploadsRootDir } = require('./uploads/upload-url.util');

    const uploadsDir = getUploadsRootDir();

    // Serve at /uploads (direct) and /api/uploads (via nginx proxy)
    app.use('/uploads', express.static(uploadsDir));
    app.use('/api/uploads', express.static(uploadsDir));

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    app.enableShutdownHooks();

    const port = Number(process.env.PORT || 3010);
    await app.listen(port, '0.0.0.0');

    console.log('\n\n=============================================');
    console.log('===> LEVANTANDO BACKEND LOCAL <===');
    console.log('=============================================\n\n');

    logger.log(`🚀 API running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
    logger.log(`🏥 Health: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
    new Logger('Bootstrap').fatal('Failed to start application', err);
    process.exit(1);
});
