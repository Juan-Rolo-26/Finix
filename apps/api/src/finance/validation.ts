import { z } from 'zod';
const label = z.string().trim().min(1).max(160);
const optionalText = z.string().trim().max(1000).nullable().optional();
const currency = z.enum(['ARS','USD','EUR']);
const cash = z.number().finite().min(0).max(1e12).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < .001, 'Máximo dos decimales');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, 'Fecha inválida');
const id = z.string().max(100).nullable().optional();
export const transactionSchema = z.object({
    description: label, merchant: optionalText, category: label.default('Otros'), categoryKey: label.default('other'),
    type: z.enum(['income','expense','transfer','card_payment','refund','investment']),
    amount: cash.refine(v => v > 0), currency: currency.default('ARS'), status: z.enum(['confirmed','pending']).default('confirmed'),
    date, accountId: id, cardId: id, notes: optionalText,
    details: z.object({
        postedDate: date.optional(), destinationAccountId: id, refundOf: id,
        installments: z.number().int().min(1).max(120).optional(), firstInstallment: date.optional(),
        incomplete: z.boolean().optional(), recurringId: id, occurrence: date.optional(),
        origin: z.enum(['manual','csv']).default('manual'),
        splits: z.array(z.object({ category: label, amount: cash })).max(30).optional(),
    }).strict().default({}),
}).strict();
export const schemas = {
    accounts: z.object({ name: label, institution: optionalText, kind: z.enum(['bank','wallet','cash','broker','debit','credit']).default('bank'), currency: currency.default('ARS'), balance: z.number().finite().min(-1e12).max(1e12).default(0), hidden: z.boolean().default(false) }).strict(),
    transactions: transactionSchema,
    cards: z.object({ name: label, brand: label.default('Tarjeta'), last4: z.string().regex(/^\d{4}$/).nullable().optional(), currency: currency.default('ARS'), creditLimit: cash.default(0), currentBalance: cash.default(0), closingDay: z.number().int().min(1).max(31), dueDay: z.number().int().min(1).max(31), active: z.boolean().default(true), accountId: id }).strict(),
    budgets: z.object({ category: label, categoryKey: label, limit: cash, month: z.number().int().min(1).max(12), year: z.number().int().min(2000).max(2100), currency: currency.default('ARS'), alertAt: z.number().int().min(1).max(100).default(80) }).strict(),
    goals: z.object({ name: label, icon: label.default('○'), target: cash, saved: cash.default(0), currency: currency.default('ARS'), deadline: date.nullable().optional(), monthlyContribution: cash.default(0) }).strict(),
    recurring: z.object({ name: label, category: label.default('Servicios'), amount: cash, currency: currency.default('ARS'), nextDate: date, frequency: z.enum(['monthly','weekly','yearly','once']).default('monthly'), active: z.boolean().default(true), accountId: id }).strict(),
};
export const preferenceSchema = z.object({
    categories: z.array(label).max(100).default(['Ingresos','Alimentos','Vivienda','Transporte','Salud','Educación','Ocio','Servicios','Otros']),
    rules: z.array(z.object({ contains: label, category: label })).max(100).default([]),
    hideEstimate: z.boolean().default(false), dataComplete: z.boolean().default(false),
    reserves: z.record(currency, cash).default({}), reminderDays: z.number().int().min(0).max(30).default(3),
    reminders: z.boolean().default(false), includePortfolio: z.boolean().default(false),
    conversion: z.object({ enabled: z.boolean(), usdToArs: z.number().positive().max(1e8), source: label, date }).nullable().optional(),
}).strict();
