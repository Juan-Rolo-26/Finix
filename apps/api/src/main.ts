import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: '*', // Allow all for dev, restrict in prod
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    // Prefix api
    app.setGlobalPrefix('api');
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
}
bootstrap();
