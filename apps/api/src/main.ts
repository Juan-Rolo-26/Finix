import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
    });

    // Stripe webhook must receive raw body for signature validation.
    app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
    app.use(bodyParser.json({ limit: '2mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));

    app.enableCors({
        origin: '*', // Allow all for dev, restrict in prod
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
    await app.listen(port);
}
bootstrap();
