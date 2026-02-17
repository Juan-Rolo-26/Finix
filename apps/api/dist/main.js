"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const { join } = require('path');
    const express = require('express');
    app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map