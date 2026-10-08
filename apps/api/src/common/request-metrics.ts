import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
export const requestMetrics = new AsyncLocalStorage<{ id: string; dbOperations: number; dbMs: number }>();
export function metricsMiddleware(req: any, res: any, next: () => void) {
    const context = { id: randomUUID(), dbOperations: 0, dbMs: 0 };
    const started = performance.now();
    requestMetrics.run(context, () => {
        const writeHead = res.writeHead;
        res.writeHead = function (...args: any[]) {
            if (!this.headersSent) {
                this.setHeader('X-Request-Id', context.id);
                if (process.env.FINIX_REQUEST_METRICS === 'true') {
                    this.setHeader('X-Finix-Db-Operations', String(context.dbOperations));
                    this.setHeader('Server-Timing', `db;dur=${context.dbMs.toFixed(2)}`);
                }
            }
            return writeHead.apply(this, args);
        };
        res.once('finish', () => {
            const elapsedMs = performance.now() - started;
            if (elapsedMs >= 500 || process.env.FINIX_REQUEST_METRICS === 'true') console.log(JSON.stringify({
                event: 'http_request', requestId: context.id, method: req.method,
                route: req.route?.path || 'unmatched', status: res.statusCode,
                elapsedMs: Number(elapsedMs.toFixed(2)), dbOperations: context.dbOperations,
                dbMs: Number(context.dbMs.toFixed(2)),
            }));
        });
        next();
    });
}
