import 'reflect-metadata';
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import { AccessControlService } from '../access/access-control.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { FinanceService } from './workspace.service';
import { FinanceController } from './workspace.controller';
import { NotificationsService } from '../notifications/notifications.service';
import { UserService } from '../user/user.service';
import { PostsService } from '../posts/posts.service';
import { CommunitiesService } from '../communities/communities.service';
import { CommunityPermissionsService } from '../communities/community-permissions.service';

const target = process.env.FINANCE_TEST_DATABASE_URL;
test('API financiera: PostgreSQL aislado, JWT real, contabilidad y privacidad', { skip: !target }, async t => {
    const url = new URL(target!);
    assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/finance_test', 'Sólo se permite la base local desechable finance_test');
    process.env.DATABASE_URL = target; process.env.DIRECT_URL = target;
    process.env.JWT_SECRET = 'isolated-finance-test-secret-not-a-production-key';
    const prisma = new PrismaService();
    const notifications = new NotificationsService(prisma, { sendNotificationEmail: () => { throw new Error('No emails in finance tests'); } } as any);
    const service = new FinanceService(prisma, new AccessControlService(prisma), notifications, { getUserPortfolios: async () => [] } as any);
    const module = await Test.createTestingModule({ imports: [PassportModule], controllers: [FinanceController], providers: [JwtStrategy, { provide: PrismaService, useValue: prisma }, { provide: FinanceService, useValue: service }] }).compile();
    const app = module.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    const origin = await app.getUrl(), jwt = new JwtService({ secret: process.env.JWT_SECRET }), users: string[] = [];
    const makeUser = async (plan: string) => {
        const id = randomUUID(); users.push(id);
        return prisma.user.create({ data: { id, username: `finance_test_${id}`, email: `${id}@example.invalid`, plan, subscriptionStatus: 'ACTIVE', isProfilePublic: true, showStats: false } });
    };
    const a = await makeUser('PRO'), b = await makeUser('CREATOR'), free = await makeUser('FREE');
    const call = async (owner: string | null, path: string, body?: any, method = 'POST') => {
        const response = await fetch(`${origin}/personal-finance/${path}`, { method: body === undefined && method === 'POST' ? 'GET' : method, headers: { 'Content-Type': 'application/json', ...(owner ? { Authorization: `Bearer ${jwt.sign({ sub: owner, iss: 'finix-api' })}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
        return { status: response.status, data: await response.json(), cache: response.headers.get('cache-control') };
    };
    const create = async (resource: string, body: any, owner = a.id) => { const r = await call(owner, resource, body); assert.equal(r.status, 201, JSON.stringify(r.data)); return r.data; };
    const snapshot = async (owner = a.id, currency = 'ARS') => { const r = await call(owner, `snapshot?month=2026-10&currency=${currency}`); assert.equal(r.status, 200); assert.equal(r.cache, 'no-store'); return r.data; };
    try {
        await t.test('migración aditiva desde la estructura anterior preserva los registros', async () => {
            // Only in the explicitly guarded disposable database, before fixtures.
            await prisma.$executeRawUnsafe('DROP TABLE "PersonalFinancePreferences"');
            await prisma.$executeRawUnsafe('ALTER TABLE "PersonalFinanceTransaction" DROP COLUMN "details", DROP COLUMN "importKey"');
            await prisma.$executeRawUnsafe('ALTER TABLE "PersonalFinanceBudget" DROP COLUMN "currency", DROP COLUMN "alertAt"');
            await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "PersonalFinanceBudget_userId_categoryKey_month_year_key" ON "PersonalFinanceBudget"("userId","categoryKey","month","year")');
            const migration = readFileSync(resolve(__dirname, '../../prisma/migrations/20261001010000_personal_finance_ledger/migration.sql'), 'utf8');
            for (const statement of migration.split(';').map(s => s.trim()).filter(Boolean)) await prisma.$executeRawUnsafe(statement);
            assert.equal(await prisma.user.count({ where: { id: { in: users } } }), 3);
        });
        const account = await create('accounts', { name: 'Efectivo prueba', currency: 'ARS', balance: 0 });
        const second = await create('accounts', { name: 'Cuenta secundaria prueba', currency: 'ARS', balance: 0 });
        const card = await create('cards', { name: 'Tarjeta prueba', last4: '1234', closingDay: 25, dueDay: 5, currency: 'ARS' });
        await create('transactions', { description: 'Ingreso privado sentinel', date: '2026-10-01', type: 'income', amount: 1000, currency: 'ARS', accountId: account.id });
        const purchase = await create('transactions', { description: 'Compra privada sentinel', date: '2026-10-02', type: 'expense', amount: 300, currency: 'ARS', cardId: card.id, category: 'Hogar', categoryKey: 'Hogar', details: { installments: 3, firstInstallment: '2026-10-10' } });
        await t.test('1. compra en tres cuotas y pago parcial se contabilizan una vez', async () => {
            await create('transactions', { description: 'Pago parcial', date: '2026-10-10', type: 'card_payment', amount: 40, currency: 'ARS', cardId: card.id, accountId: account.id });
            const s = await snapshot(); assert.equal(s.summary.expenses, 300); assert.equal(s.summary.upcoming[0].amount, 60); assert.equal(s.summary.accounts.find((r:any) => r.id === account.id).calculatedBalance, 960); assert.equal(s.summary.estimate.value, 900);
        });
        await t.test('2. transferencia propia no altera ingresos o gastos', async () => {
            await create('transactions', { description: 'Transferencia propia', date: '2026-10-10', type: 'transfer', amount: 50, currency: 'ARS', accountId: account.id, details: { destinationAccountId: second.id } });
            const s = await snapshot(); assert.equal(s.summary.income, 1000); assert.equal(s.summary.expenses, 300); assert.equal(s.summary.accounts.find((r:any) => r.id === second.id).calculatedBalance, 50);
        });
        await t.test('3. CSV: vista previa, ambigüedad, duplicados, revisión y reimportación', async () => {
            const config = { text: '\uFEFFFecha;Concepto;Monto;Moneda\r\n11/10/2026;Supermercado prueba;-1.234,56;ARS\r\n12/10/2026;Cuota 03/12;-100,00;ARS', mapping: { date: 0, description: 1, amount: 2, currency: 3 }, accountId: account.id, decimal: ',', dateOrder: 'DMY', positiveType: 'income', delimiter: ';' };
            await service.savePreferences(a.id, { rules: [{ contains: 'supermercado', category: 'Alimentos' }] });
            const preview = await call(a.id, 'import/preview', config); assert.equal(preview.data.rows[0].row.category, 'Alimentos'); assert.ok(preview.data.rows[1].ambiguous);
            const imported = await call(a.id, 'import/confirm', { ...config, selectedLines: [2, 3], confirm: true }); assert.equal(imported.data.imported, 1); assert.equal(imported.data.omitted, 1);
            const again = await call(a.id, 'import/confirm', { ...config, selectedLines: [2], confirm: true }); assert.equal(again.data.imported, 0);
            const s = await snapshot(); assert.equal(s.summary.expenses, 300); assert.equal(s.summary.pendingCount, 1);
            const pending = s.transactions.find((r:any) => r.status === 'pending');
            assert.equal((await call(a.id, `transactions/${pending.id}`, { status: 'confirmed' }, 'PATCH')).status, 200);
            assert.equal((await snapshot()).summary.expenses, 1534.56);
            assert.equal((await call(a.id, 'import/confirm', { ...config, selectedLines: [2], confirm: true })).data.imported, 0);
        });
        await t.test('4. reintegro corrige gasto y rechaza sobredevoluciones', async () => {
            await create('transactions', { description: 'Devolución parcial', date: '2026-10-13', type: 'refund', amount: 50, currency: 'ARS', cardId: card.id, details: { refundOf: purchase.id } });
            assert.equal((await snapshot()).summary.expenses, 1484.56);
            assert.equal((await call(a.id, 'transactions', { description: 'Exceso', date: '2026-10-13', type: 'refund', amount: 251, currency: 'ARS', cardId: card.id, details: { refundOf: purchase.id } })).status, 400);
            assert.equal((await call(a.id, `transactions/${purchase.id}`, undefined, 'DELETE')).status, 400);
        });
        await t.test('5. monedas separadas y conversión explícita con fuente y fecha', async () => {
            await create('transactions', { description: 'Ingreso USD', date: '2026-10-01', type: 'income', amount: 10, currency: 'USD' });
            assert.equal((await snapshot()).conversion, null); assert.equal((await snapshot(a.id, 'USD')).summary.income, 10);
            await service.savePreferences(a.id, { conversion: { enabled: true, usdToArs: 1500, source: 'Cotización de prueba elegida', date: '2026-10-01' } });
            const s = await snapshot(); assert.equal(s.summary.income, 1000); assert.equal(s.conversion.income, 16000); assert.equal(s.conversion.source, 'Cotización de prueba elegida');
        });
        await t.test('6. aislamiento propietario en consultas, escritura, relaciones, aportes y exportación', async () => {
            assert.equal((await snapshot(b.id)).transactions.length, 0);
            assert.equal((await call(b.id, `transactions/${purchase.id}`, { description: 'Ajeno' }, 'PATCH')).status, 404);
            assert.equal((await call(b.id, `accounts/${account.id}`, undefined, 'DELETE')).status, 404);
            assert.equal((await call(b.id, 'transactions', { description: 'Ajeno', date: '2026-10-01', type: 'expense', amount: 1, accountId: account.id })).status, 404);
            assert.equal((await call(b.id, 'transactions', { description: 'Ajeno', date: '2026-10-01', type: 'expense', amount: 1, cardId: card.id })).status, 404);
            assert.equal((await call(b.id, 'export')).data.transactions.includes('sentinel'), false);
            const goal = await create('goals', { name: 'Meta privada', target: 100 });
            assert.equal((await call(b.id, `goals/${goal.id}/contributions`, { amount: 10 })).status, 404);
            assert.equal((await call(a.id, `goals/${goal.id}/contributions`, { amount: 10 })).data.saved, '10');
            assert.equal((await call(a.id, 'accounts', { name: 'Inyección', userId: b.id })).status, 400);
        });
        await t.test('7. los servicios públicos no exponen ni crean datos financieros', async () => {
            assert.equal(await prisma.post.count({ where: { authorId: a.id } }), 0);
            await prisma.post.create({data:{authorId:a.id,content:'Publicación pública de prueba'}});
            const published = await prisma.community.create({data:{creatorId:a.id,name:'Comunidad pública de prueba',description:'Descripción pública',category:'Argentina'}});
            const profile = await new UserService(prisma, notifications, {} as any).getUserProfile(a.username, b.id);
            const feed = await new PostsService(prisma, notifications, {} as any).getFeed(b.id, { sort: 'recent' });
            const community = await new CommunitiesService(prisma, {} as any, new CommunityPermissionsService(prisma), {} as any, {} as any).findAll({}, b.id);
            for (const output of [profile, feed, community]) { const json = JSON.stringify(output); assert.ok(!json.includes('sentinel')); assert.ok(!json.includes('personalFinance')); }
            assert.equal(feed.posts.length,1); assert.equal(community.length,1);
            await prisma.community.delete({where:{id:published.id}});
        });
        await t.test('8. Free ACTIVE y llamadas sin JWT bloqueadas en toda la API', async () => {
            assert.equal((await call(null, 'snapshot')).status, 401);
            for (const [path, body, method] of [['snapshot', undefined, 'GET'], ['transactions', undefined, 'GET'], ['export', undefined, 'GET'], ['accounts', { name: 'No' }, 'POST'], [`transactions/${purchase.id}`, {}, 'PATCH'], [`transactions/${purchase.id}`, undefined, 'DELETE'], ['preferences', {}, 'POST'], ['import/preview', {}, 'POST'], ['import/confirm', {}, 'POST'], ['erase', { confirmation: 'ELIMINAR FINANZAS' }, 'POST']] as any[]) assert.equal((await call(free.id, path, body, method)).status, 403, path);
            await prisma.user.update({ where: { id: b.id }, data: { subscriptionStatus: 'CANCELED' } });
            assert.equal((await call(b.id, 'snapshot')).status, 403);
            await prisma.user.update({ where: { id: b.id }, data: { subscriptionStatus: 'ACTIVE' } });
        });
        await t.test('10. estimación reconoce faltantes, se explica y se puede ocultar', async () => {
            const s = await snapshot(); assert.equal(s.summary.estimate.incomplete, true); assert.ok(s.summary.estimate.formula.includes('Ingresos confirmados'));
            await service.savePreferences(a.id, { hideEstimate: true }); assert.equal((await snapshot()).summary.estimate.hidden, true);
        });
        await t.test('avisos reales, privados, opt-in, genéricos y sin duplicar en un día', async () => {
            const date = new Date().toISOString().slice(0, 10);
            await create('recurring', { name: 'Servicio privado sentinel', amount: 123.45, category: 'Servicios', currency: 'ARS', nextDate: date, frequency: 'once' });
            await service.savePreferences(a.id, { reminders: true }); await service.remind(); await service.remind();
            const notices = await prisma.notification.findMany({ where: { userId: a.id, entityType: 'personal-finance' } });
            assert.equal(notices.length, 1); assert.ok(!JSON.stringify(notices).includes('sentinel')); assert.ok(!JSON.stringify(notices).includes('123.45'));
            assert.equal(await prisma.notification.count({ where: { userId: b.id, entityType: 'personal-finance' } }), 0);
        });
        await t.test('9. exportar y eliminar sólo los datos financieros del propietario', async () => {
            const exported = await call(a.id, 'export'); assert.ok(exported.data.transactions.includes('Compra privada sentinel')); assert.ok(exported.data.categories.includes('Categoría'));
            await create('accounts', { name: 'Sobrevive', currency: 'USD' }, b.id);
            assert.equal((await call(a.id, 'erase', { confirmation: 'no' })).status, 400);
            assert.equal((await call(a.id, 'erase', { confirmation: 'ELIMINAR FINANZAS' })).status, 201);
            for (const resource of ['transactions', 'accounts', 'cards', 'goals', 'budgets', 'recurring']) assert.equal((await snapshot())[resource].length, 0);
            assert.equal((await snapshot(b.id)).accounts.length, 1);
        });
    } finally {
        await prisma.community.deleteMany({where:{creatorId:{in:users}}});
        await prisma.user.deleteMany({ where: { id: { in: users } } });
        await app.close();
        await prisma.$disconnect();
    }
});
