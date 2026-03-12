import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { isAllowedOrigin } from './config/allowed-origins';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
    });

    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    // Stripe webhook must receive raw body for signature validation.
    app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
    app.use(bodyParser.json({ limit: '2mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    app.enableCors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('CORS origin not allowed'));
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    // Prefix api
    app.setGlobalPrefix('api');

    // Serve static files (avatars, post media, etc.)
    const { join } = require('path');
    const express = require('express');
    app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

    const port = Number(process.env.PORT || 3001);
    await app.listen(port, '0.0.0.0');
}
bootstrap();
