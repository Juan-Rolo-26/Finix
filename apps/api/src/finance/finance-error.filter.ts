import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

/** Never let Prisma's error formatter print private query arguments to logs. */
@Catch()
export class FinanceErrorFilter implements ExceptionFilter {
    catch(error: unknown, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();
        const code = (error as any)?.code;
        const status = error instanceof HttpException ? error.getStatus() : ['P2002', 'P2034'].includes(code) ? 409 : 500;
        const message = error instanceof HttpException ? error.message : code === 'P2002' ? 'Este registro ya existe. Revisá los datos antes de repetirlo.' : code === 'P2034' ? 'Hubo otro cambio simultáneo. Volvé a intentar.' : 'No se pudo completar la operación financiera.';
        response.setHeader('Cache-Control', 'no-store');
        response.status(status).json({ statusCode: status, message });
    }
}
