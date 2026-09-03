import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { isAllowedOrigin } from './config/allowed-origins';

const logger = new Logger('Bootstrap');

async function bootstrap() {
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
    httpAdapter.get('/ready', (_req, res) => {
        // TODO: add DB + Redis ping when readiness probes are needed
        res.status(200).json({ status: 'ready' });
    });

    // ── Static uploads (local filesystem fallback — use R2/S3 in production) ──
    const { join } = require('path');
    const { existsSync, mkdirSync } = require('fs');
    const express = require('express');

    const uploadsDir = join(__dirname, '..', 'uploads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

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
