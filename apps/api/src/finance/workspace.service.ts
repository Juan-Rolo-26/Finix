import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { AccessControlService } from '../access/access-control.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { schemas, preferenceSchema } from './validation';
import { addMonths, cents, commitments, details, iso, monthDay, report } from './ledger';
import { csvAmount, csvDate, parseCsv, toCsv } from './csv';

const models = { accounts: 'personalFinanceAccount', transactions: 'personalFinanceTransaction', budgets: 'personalFinanceBudget', goals: 'personalFinanceGoal', recurring: 'personalFinanceRecurringPayment', cards: 'personalFinanceCard' } as const;
type Resource = keyof typeof models;
function parse(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) throw new BadRequestException(result.error.issues.map((i: any) => i.path.join('.') + ': ' + i.message).join('; '));
    return result.data;
}
@Injectable()
export class FinanceService {
    constructor(private readonly prisma: PrismaService, private readonly access: AccessControlService,
        private readonly notifications: NotificationsService, private readonly portfolios: PortfolioService) {}
    private model(db: any, resource: string) {
        if (!Object.prototype.hasOwnProperty.call(models, resource)) throw new NotFoundException('Recurso no encontrado');
        return db[models[resource as Resource]];
    }
    private async owned(db: any, userId: string, resource: string, id: string) {
        const row = await this.model(db, resource).findFirst({ where: { id, userId } });
        if (!row) throw new NotFoundException('Registro no encontrado');
        return row;
    }
    private async preferences(userId: string) {
        const row = await this.prisma.personalFinancePreferences.findUnique({ where: { userId } });
        return parse(preferenceSchema, row ? JSON.parse(row.data) : {});
    }
    async savePreferences(userId: string, body: unknown) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        const data = JSON.stringify(parse(preferenceSchema, body));
        await this.prisma.personalFinancePreferences.upsert({ where: { userId }, create: { userId, data }, update: { data } });
        return JSON.parse(data);
    }
    async list(userId: string, resource: string) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        return this.model(this.prisma, resource).findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    }
    async getSnapshot(userId: string, currency = 'ARS', month = new Date().toISOString().slice(0,7)) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        if (!['ARS','USD','EUR'].includes(currency) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || Number(month.slice(0,4)) < 2000 || Number(month.slice(0,4)) > 2100) throw new BadRequestException('Período o moneda inválidos');
        const data: any = {};
        for (const resource of Object.keys(models)) data[resource] = await this.model(this.prisma, resource).findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        const prefs = await this.preferences(userId), summary = report(data,month,currency,prefs);
        const history = Array.from({length: 12}, (_,i) => {
            const m = addMonths(month + '-01', i-11).slice(0,7), r = report(data,m,currency,prefs);
            return { month: m, income: r.income, expenses: r.expenses, difference: r.difference, categories: r.categories };
        });
        const recurringChanges = data.recurring.map((r: any) => {
            const paid = data.transactions.filter((t: any) => t.status === 'confirmed' && t.currency === r.currency && details(t).recurringId === r.id).sort((a: any,b: any) => iso(b.date).localeCompare(iso(a.date)));
            return { id:r.id, name:r.name, currency:r.currency, previous:paid[1] ? Math.abs(Number(paid[1].amount)) : null, latest:paid[0] ? Math.abs(Number(paid[0].amount)) : null };
        });
        let portfolio: any = null;
        if (prefs.includePortfolio) try { portfolio = (await this.portfolios.getUserPortfolios(userId)).map((p:any) => ({id:p.id,name:p.nombre,currency:p.monedaBase,positions:p.assets?.length || 0,cashByCurrency:p.cashByCurrency})); } catch { portfolio = { unavailable: true }; }
        let conversion: any = null;
        if (prefs.conversion?.enabled) {
            const ars = report(data,month,'ARS',prefs), usd = report(data,month,'USD',prefs), rate = prefs.conversion.usdToArs;
            conversion = { ...prefs.conversion, currency:'ARS', income:ars.income+usd.income*rate, expenses:ars.expenses+usd.expenses*rate, excludes:'EUR' };
        }
        const asOf = iso(new Date(new Date(addMonths(month+'-01',1)).getTime()-86400000));
        const obligations = commitments(data.transactions,data.cards,[],month+'-01',addMonths(month+'-01',120),asOf);
        const cardSummary = data.cards.map((card:any) => {
            const events = obligations.filter(e => e.cardId === card.id && e.currency === currency);
            const first = events[0]?.date || null;
            const anchor = month === iso(new Date()).slice(0,7) ? iso(new Date()) : asOf;
            const closingMonth = addMonths(anchor.slice(0,7)+'-01',Number(anchor.slice(8)) > card.closingDay ? 1 : 0);
            const closing = card.closingDay ? monthDay(closingMonth,card.closingDay) : null;
            const previous = closing ? monthDay(addMonths(closingMonth,-1),card.closingDay) : null;
            const purchases = data.transactions.filter((t:any) => t.cardId === card.id && t.currency === currency && t.status === 'confirmed' && t.type === 'expense' && previous && iso(t.date) > previous && iso(t.date) <= closing);
            return {cardId:card.id,currency,debt:events.reduce((s,e) => s+e.cents,0)/100,nextDate:first,nextAmount:events.filter(e => e.date === first).reduce((s,e) => s+e.cents,0)/100,closing,statementPurchases:purchases.reduce((s:number,t:any) => s+Math.abs(cents(t.amount)),0)/100,incomplete:data.transactions.some((t:any) => t.cardId === card.id && t.currency === currency && (t.status !== 'confirmed' || details(t).incomplete)) || !closing};
        });
        return { ...data, preferences:prefs, summary, history, recurringChanges, conversion, portfolio, cardSummary };
    }
    private clean(resource: Resource, row: any) {
        const allowed = Object.keys((schemas[resource] as any).shape);
        const output = Object.fromEntries(allowed.filter(k => row[k] !== undefined).map(k => [k,row[k]]));
        for (const k of ['amount','balance','limit','target','saved','monthlyContribution','creditLimit','currentBalance']) if (output[k] !== undefined) output[k] = Number(output[k]);
        if (resource === 'transactions') { output.amount = Math.abs(output.amount as number); output.details = details(row); }
        for (const k of ['date','nextDate','deadline']) if (output[k]) output[k] = iso(output[k] as Date);
        return output;
    }
    private async validateReferences(db: any, userId: string, resource: Resource, data: any, id?: string) {
        if (data.accountId) {
            const account = await this.owned(db,userId,'accounts',data.accountId);
            if (['transactions','recurring'].includes(resource) && account.currency !== data.currency) throw new BadRequestException('La moneda debe coincidir con la cuenta');
        }
        if (data.cardId) await this.owned(db,userId,'cards',data.cardId);
        if (resource !== 'transactions') return;
        const meta = data.details;
        if (data.cardId && !['expense','refund','card_payment'].includes(data.type)) throw new BadRequestException('Tipo incompatible con tarjeta');
        if (data.type === 'card_payment' && (!data.cardId || !data.accountId)) throw new BadRequestException('Elegí tarjeta y cuenta de pago');
        if (data.type === 'transfer') {
            if (!data.accountId || !meta.destinationAccountId || meta.destinationAccountId === data.accountId || data.cardId) throw new BadRequestException('Elegí dos cuentas diferentes');
            const dest = await this.owned(db,userId,'accounts',meta.destinationAccountId);
            if (dest.currency !== data.currency) throw new BadRequestException('Las transferencias requieren cuentas de la misma moneda');
        } else if (meta.destinationAccountId) throw new BadRequestException('Destino permitido sólo en transferencias');
        if (meta.installments && (!data.cardId || data.type !== 'expense' || !meta.firstInstallment)) throw new BadRequestException('Las cuotas requieren una compra, tarjeta y primera fecha');
        if (meta.recurringId) {
            const recurring = await this.owned(db,userId,'recurring',meta.recurringId);
            if (!meta.occurrence || data.type !== 'expense' || recurring.currency !== data.currency) throw new BadRequestException('Pago recurrente incompatible');
            const other = await db.personalFinanceTransaction.findMany({ where:{userId,id:{not:id || ''}} });
            if (other.some((t:any) => details(t).recurringId === meta.recurringId && details(t).occurrence === meta.occurrence)) throw new BadRequestException('Este vencimiento ya fue registrado');
        }
        if (data.type === 'refund') {
            if (!meta.refundOf || meta.refundOf === id) throw new BadRequestException('Elegí la compra original');
            const original = await this.owned(db,userId,'transactions',meta.refundOf);
            if (original.type !== 'expense' || original.currency !== data.currency || original.cardId !== (data.cardId || null) || original.status !== 'confirmed') throw new BadRequestException('Devolución incompatible con la compra original');
            const refunds = await db.personalFinanceTransaction.findMany({ where:{userId,type:'refund',id:{not:id || ''}} });
            const returned = refunds.filter((r:any) => details(r).refundOf === original.id).reduce((s:number,r:any) => s + Math.abs(cents(r.amount)),0);
            if (returned+cents(data.amount) > Math.abs(cents(original.amount))) throw new BadRequestException('La devolución supera el importe restante');
            data.category=original.category; data.categoryKey=original.categoryKey;
        } else if (meta.refundOf) throw new BadRequestException('Compra original permitida sólo en devoluciones');
        if (meta.splits?.length && (data.type !== 'expense' || meta.splits.reduce((s:number,v:any) => s+cents(v.amount),0) !== cents(data.amount))) throw new BadRequestException('La suma de categorías debe coincidir con el gasto');
    }
    private async write(db: any, userId: string, resource: Resource, body: any, id?: string, importKey?: string) {
        const original = id ? await this.owned(db,userId,resource,id) : null;
        if (original && resource === 'transactions') {
            const linked = await db.personalFinanceTransaction.findMany({ where:{userId,type:'refund'} });
            if (linked.some((r:any) => details(r).refundOf === id)) throw new BadRequestException('Corregí primero las devoluciones vinculadas');
        }
        const data = parse(schemas[resource], { ...(original ? this.clean(resource,original) : {}), ...body });
        if (original && resource === 'accounts' && data.currency !== original.currency) {
            const linked = await db.personalFinanceTransaction.findMany({where:{userId}});
            if (linked.some((t:any) => t.accountId === id || details(t).destinationAccountId === id) || await db.personalFinanceRecurringPayment.count({where:{userId,accountId:id}})) throw new BadRequestException('No se puede cambiar la moneda de una cuenta con movimientos o recurrentes');
        }
        await this.validateReferences(db,userId,resource,data,id);
        if (resource === 'transactions') {
            data.amount = ['income','refund'].includes(data.type) ? data.amount : -data.amount;
            data.details = JSON.stringify(data.details);
        }
        for (const key of ['date','nextDate','deadline']) if (data[key]) data[key] = new Date(data[key]+'T12:00:00Z');
        return id ? this.model(db,resource).update({where:{id},data}) : this.model(db,resource).create({data:{...data,userId,...(importKey ? {importKey} : {})}});
    }
    async save(userId: string, resource: Resource, body: any, id?: string) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']); this.model(this.prisma,resource);
        return this.prisma.$transaction(db => this.write(db,userId,resource,body,id), {isolationLevel:'Serializable'});
    }
    async remove(userId: string, resource: Resource, id: string) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        return this.prisma.$transaction(async db => {
            await this.owned(db,userId,resource,id);
            const rows = await db.personalFinanceTransaction.findMany({where:{userId}});
            if (resource === 'transactions' && rows.some(r => details(r).refundOf === id)) throw new BadRequestException('Eliminá primero las devoluciones vinculadas');
            if (['accounts','cards'].includes(resource) && rows.some(r => r.accountId === id || r.cardId === id || details(r).destinationAccountId === id)) throw new BadRequestException('Hay movimientos vinculados a esta fuente');
            await this.model(db,resource).delete({where:{id}}); return {ok:true};
        }, {isolationLevel:'Serializable'});
    }
    async contribute(userId: string, id: string, value: number) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        if (!Number.isFinite(value) || value <= 0 || value > 1e12) throw new BadRequestException('Importe inválido');
        return this.prisma.$transaction(async db => {
            await this.owned(db,userId,'goals',id);
            return db.personalFinanceGoal.update({where:{id},data:{saved:{increment:cents(value)/100}}});
        });
    }
    private fingerprint(userId: string, row: any, occurrence: number) {
        return createHash('sha256').update(JSON.stringify([userId,row.accountId,row.cardId,row.date,row.description.trim().toLowerCase(),cents(row.amount),row.currency,row.type,occurrence])).digest('hex');
    }
    async previewImport(userId: string, body: any) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        if (typeof body.text !== 'string' || !body.mapping || !['income','expense'].includes(body.positiveType) || ![',','.'].includes(body.decimal) || !['DMY','MDY'].includes(body.dateOrder)) throw new BadRequestException('Revisá el archivo y su configuración');
        if (!body.accountId && !body.cardId) throw new BadRequestException('Elegí cuenta o tarjeta');
        if (body.accountId) await this.owned(this.prisma,userId,'accounts',body.accountId);
        if (body.cardId) await this.owned(this.prisma,userId,'cards',body.cardId);
        let parsed: string[][];
        try { parsed=parseCsv(body.text,body.delimiter); } catch(e) { throw new BadRequestException((e as Error).message); }
        const headers=parsed.shift() || [], prefs=await this.preferences(userId);
        const existing=await this.prisma.personalFinanceTransaction.findMany({where:{userId}});
        const keys=new Set(existing.map(t => t.importKey)), occurrences=new Map<string,number>();
        const rows=parsed.map((cells,index) => {
            try {
                if (cells.length !== headers.length) throw new Error('Cantidad de columnas distinta al encabezado');
                const get=(key:string) => cells[Number(body.mapping[key])] || '';
                const value=csvAmount(get('amount'),body.decimal), description=get('description').trim(), date=csvDate(get('date'),body.dateOrder);
                const currency=body.mapping.currency === undefined || body.mapping.currency === '' ? body.currency : get('currency').trim().toUpperCase();
                const type=value >= 0 ? body.positiveType : body.positiveType === 'income' ? 'expense' : 'income';
                const category=prefs.rules.find((r:any) => description.toLowerCase().includes(r.contains.toLowerCase()))?.category || 'Otros';
                const row:any={description,date,amount:Math.abs(value),currency,type,category,categoryKey:category,accountId:body.accountId || null,cardId:body.cardId || null,status:'pending',details:{origin:'csv',incomplete:/cuota|\d+\s*\/\s*\d+/i.test(description)}};
                parse(schemas.transactions,row);
                const base=this.fingerprint(userId,row,0), occurrence=(occurrences.get(base) || 0)+1;
                occurrences.set(base,occurrence);
                const key=this.fingerprint(userId,row,occurrence), duplicate=keys.has(key);
                const possibleDuplicate=existing.some(t => t.accountId === row.accountId && t.cardId === row.cardId && iso(t.date) === date && Math.abs(cents(t.amount)) === cents(row.amount) && t.currency === currency);
                return {line:index+2,row,key,duplicate,ambiguous:row.details.incomplete || possibleDuplicate || (row.cardId && type === 'income') || /transfer|pago.*(tarjeta|resumen)|reintegro|devoluci/i.test(description)};
            } catch(e) { return {line:index+2,error:(e as Error).message}; }
        });
        return {headers,rows};
    }
    async importCsv(userId:string,body:any) {
        const preview=await this.previewImport(userId,body);
        if (!Array.isArray(body.selectedLines) || body.confirm !== true) throw new BadRequestException('Confirmá la selección');
        const selected=new Set(body.selectedLines); let imported=0,omitted=0;
        for (const entry of preview.rows as any[]) {
            if (!selected.has(entry.line) || entry.error || entry.duplicate || entry.ambiguous) {omitted++;continue;}
            try { await this.prisma.$transaction(db => this.write(db,userId,'transactions',entry.row,undefined,entry.key), {isolationLevel:'Serializable'}); imported++; }
            catch(e) {
                if ((e as any).code === 'P2002') omitted++;
                else throw new BadRequestException('Se importaron '+imported+' movimientos. Revisá cuenta y moneda; los ya guardados se omitirán al reintentar.');
            }
        }
        return {imported,omitted,pendingReview:imported};
    }
    async exportData(userId:string) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        const transactions=await this.list(userId,'transactions'),prefs=await this.preferences(userId);
        return {transactions:toCsv([['ID','Fecha compra','Contabilización','Descripción','Comercio','Categoría','Tipo','Importe original','Moneda','Estado','Cuenta ID','Tarjeta ID','Notas','Detalles'],
            ...transactions.map((t:any) => [t.id,iso(t.date),details(t).postedDate,t.description,t.merchant,t.category,t.type,Number(t.amount).toFixed(2),t.currency,t.status,t.accountId,t.cardId,t.notes,t.details])]),
            categories:toCsv([['Categoría'],...prefs.categories.map((c:string) => [c])])};
    }
    async erase(userId:string,confirmation:string) {
        await this.access.requirePlan(userId, ['PRO','CREATOR','PRO_CREATOR']);
        if (confirmation !== 'ELIMINAR FINANZAS') throw new BadRequestException('Confirmación requerida');
        await this.prisma.$transaction(async db => {
            for (const resource of ['transactions','recurring','cards','budgets','goals','accounts']) await this.model(db,resource).deleteMany({where:{userId}});
            await db.personalFinancePreferences.deleteMany({where:{userId}});
            await db.notification.deleteMany({where:{userId,entityType:'personal-finance'}});
        });
        return {ok:true};
    }
    @Cron('0 9 * * *', {timeZone:'America/Argentina/Buenos_Aires'})
    async remind() {
        const enabled=await this.prisma.personalFinancePreferences.findMany();
        for (const pref of enabled) {
            const settings=JSON.parse(pref.data); if (!settings.reminders) continue;
            try {
                await this.access.requirePlan(pref.userId, ['PRO','CREATOR','PRO_CREATOR']);
                const today=iso(new Date()), until=iso(new Date(Date.now()+settings.reminderDays*86400000));
                const snapshots=await Promise.all(['ARS','USD','EUR'].map(c => this.getSnapshot(pref.userId,c)));
                if (!snapshots.some(s => s.summary.upcoming.some(e => e.date <= until) || s.summary.budgets.some((b:any) => b.alert))) continue;
                const entityId='finance-'+today;
                if (await this.prisma.notification.findFirst({where:{userId:pref.userId,entityType:'personal-finance',entityId}})) continue;
                await this.notifications.createNotification({userId:pref.userId,type:'SYSTEM_ALERT',priority:'NORMAL',entityType:'personal-finance',entityId,title:'Revisá tus próximos pagos y presupuestos',message:'Tenés avisos en tu espacio privado de Finanzas Personales.',link:'/finanzas/calendario'});
            } catch { /* Private payloads never reach logs. Retry next day. */ }
        }
    }
}
