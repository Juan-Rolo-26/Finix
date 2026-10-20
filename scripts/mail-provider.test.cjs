// Isolated tests: fetch and SMTP are always replaced; no real mail is sent.
const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, skipProject: true, compilerOptions: {
    module: 'CommonJS', target: 'ES2021', experimentalDecorators: true, emitDecoratorMetadata: true,
} });
const { MailService } = require('../apps/api/src/mail/mail.service.ts');
const nodemailer = require('nodemailer');
const keys = ['MAIL_PROVIDER', 'RESEND_API_KEY', 'SMTP_PASS', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'EMAIL_FROM', 'FINIX_LOCAL_MODE', 'DATABASE_URL', 'NODE_ENV'];
const email = { to: 'test@example.invalid', subject: 'Subject marker', text: 'OTP-PRIVATE-123456', html: '<b>OTP-PRIVATE-123456</b>', replyTo: 'reply@example.invalid', idempotencyKey: 'isolated-test' };
async function fixture(env, run, options = {}) {
    const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
    const savedFetch = global.fetch;
    const savedTransport = nodemailer.createTransport;
    const savedLog = console.log;
    const logs = [], smtp = [], requests = [];
    try {
        keys.forEach(k => delete process.env[k]);
        Object.assign(process.env, { NODE_ENV: 'production' }, env);
        global.fetch = async (...args) => { requests.push(args); if (options.fetchError) throw options.fetchError; return options.response || { ok: true, status: 200, json: async () => ({ id: 'mock-resend' }) }; };
        nodemailer.createTransport = config => { smtp.push(config); return { sendMail: async params => {
            smtp[smtp.length - 1].submitted = params;
            if (options.smtpError) throw options.smtpError;
            return options.smtpResult || { messageId: 'mock-smtp', accepted: [email.to], rejected: [] };
        } }; };
        console.log = (...values) => logs.push(values.join(' '));
        const service = new MailService();
        service.logger = Object.fromEntries(['log', 'warn', 'error'].map(method => [method, message => logs.push(message)]));
        await run({ service, logs, smtp, requests });
    } finally {
        keys.forEach(k => saved[k] === undefined ? delete process.env[k] : process.env[k] = saved[k]);
        global.fetch = savedFetch; nodemailer.createTransport = savedTransport; console.log = savedLog;
    }
}
function privateOutput(logs, error) {
    const value = JSON.stringify([logs, error?.message, error?.getResponse?.()]);
    for (const secret of [email.text, email.to, email.replyTo, 'fake-api-token', 'fake-smtp-password', 'PRIVATE-PROVIDER-RESPONSE']) assert.equal(value.includes(secret), false, secret + ' must not appear in logs or public errors');
}
test('SMTP password is not used as Resend API key; configured SMTP gets authentication and payload', () => fixture({ SMTP_HOST: 'smtp.example.invalid', SMTP_USER: 'mailer', SMTP_PASS: 'fake-smtp-password', SMTP_PORT: '465' }, async ({ service, smtp, requests, logs }) => {
    assert.deepEqual(await service.sendEmail(email), { id: 'mock-smtp' });
    assert.equal(requests.length, 0); assert.equal(smtp[0].host, 'smtp.example.invalid');
    assert.equal(smtp[0].secure, true); assert.deepEqual(smtp[0].auth, { user: 'mailer', pass: 'fake-smtp-password' });
    assert.equal(smtp[0].submitted.text, email.text); privateOutput(logs);
}));
test('explicit SMTP provider takes priority over a configured Resend key', () => fixture({ MAIL_PROVIDER: 'smtp', RESEND_API_KEY: 'fake-api-token', SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '587', SMTP_SECURE: 'false' }, async ({ service, smtp, requests }) => {
    await service.sendEmail(email); assert.equal(requests.length, 0); assert.equal(smtp[0].secure, false); assert.equal(smtp[0].auth, undefined);
}));
test('Resend key selects Resend and preserves reply-to and idempotency', () => fixture({ RESEND_API_KEY: 'fake-api-token', SMTP_PASS: 'fake-smtp-password' }, async ({ service, requests, smtp, logs }) => {
    assert.deepEqual(await service.sendEmail(email), { id: 'mock-resend' }); assert.equal(smtp.length, 0);
    const [, request] = requests[0]; assert.equal(request.headers.Authorization, 'Bearer fake-api-token');
    assert.equal(request.headers['Idempotency-Key'], 'isolated-test'); assert.equal(JSON.parse(request.body).reply_to, email.replyTo); privateOutput(logs);
}));
test('invalid Resend credentials produce safe error, no fallback, no leaked provider body or OTP', () => fixture({ RESEND_API_KEY: 'fake-api-token' }, async ({ service, logs, smtp }) => {
    await assert.rejects(service.sendEmail(email), error => { privateOutput(logs, error); return /No se pudo enviar/.test(error.message); }); assert.equal(smtp.length, 0);
}, { response: { ok: false, status: 401, json: async () => ({ message: 'PRIVATE-PROVIDER-RESPONSE ' + email.text }) } }));
test('Resend transport exceptions do not reveal request credentials', () => fixture({ RESEND_API_KEY: 'fake-api-token' }, async ({ service, logs }) => {
    await assert.rejects(service.sendEmail(email), error => { privateOutput(logs, error); return true; });
}, { fetchError: new Error('fake-api-token ' + email.text) }));
test('SMTP failure does not fall back to success or expose secrets', () => fixture({ SMTP_HOST: 'smtp.example.invalid', SMTP_USER: 'mailer', SMTP_PASS: 'fake-smtp-password' }, async ({ service, logs }) => {
    await assert.rejects(service.sendEmail(email), error => { privateOutput(logs, error); return /No se pudo enviar/.test(error.message); });
}, { smtpError: new Error('fake-smtp-password ' + email.text) }));
test('SMTP resolved rejection is still treated as failed delivery', () => fixture({ SMTP_HOST: 'smtp.example.invalid' }, async ({ service, logs }) => {
    await assert.rejects(service.sendEmail(email), error => { privateOutput(logs, error); return true; });
}, { smtpResult: { messageId: 'mock', accepted: [], rejected: [email.to] } }));
test('production without a real provider fails before sending or logging mail', () => fixture({ SMTP_PASS: 'fake-smtp-password' }, async ({ service, logs, smtp, requests }) => {
    await assert.rejects(service.sendEmail(email), error => { privateOutput(logs, error); return /configuración/.test(error.message); });
    assert.equal(smtp.length + requests.length, 0); assert.equal(logs.length, 0);
}));
test('invalid provider configuration cannot silently choose another provider', async () => {
    for (const env of [{ MAIL_PROVIDER: 'unknown', RESEND_API_KEY: 'fake-api-token' }, { MAIL_PROVIDER: 'resend', SMTP_HOST: 'smtp.example.invalid' }, { MAIL_PROVIDER: 'smtp', RESEND_API_KEY: 'fake-api-token' }, { SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '0' }, { SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: 'oops' }, { SMTP_HOST: 'smtp.example.invalid', SMTP_SECURE: 'oops' }, { SMTP_HOST: 'smtp.example.invalid', SMTP_USER: 'mailer' }]) {
        await fixture(env, async ({ service, logs, smtp, requests }) => { await assert.rejects(service.sendEmail(email)); assert.equal(smtp.length + requests.length, 0); privateOutput(logs); });
    }
});
const local = { FINIX_LOCAL_MODE: 'true', NODE_ENV: 'development', DATABASE_URL: 'postgresql://test@127.0.0.1:15432/isolated', RESEND_API_KEY: 'fake-api-token', SMTP_HOST: 'smtp.example.invalid' };
test('validated local mode always uses Mailpit, even with real-provider settings present', () => fixture(local, async ({ service, smtp, requests, logs }) => {
    await service.sendEmail(email); assert.equal(requests.length, 0); assert.equal(smtp[0].host, '127.0.0.1'); assert.equal(smtp[0].port, 1025); privateOutput(logs);
}));
test('documented console fallback is confined to validated local mode', () => fixture(local, async ({ service, logs, requests }) => {
    assert.deepEqual(await service.sendEmail(email), { id: 'mock-local-console' }); assert.equal(requests.length, 0); assert.equal(logs.some(line => line.includes(email.text)), true);
}, { smtpError: new Error('Mailpit unavailable') }));
test('local fallback cannot run with a remote database or production', async () => {
    for (const env of [{ ...local, NODE_ENV: 'production' }, { ...local, DATABASE_URL: 'postgresql://test@remote.example.invalid/isolated' }]) {
        await fixture(env, async ({ service, logs, smtp, requests }) => { await assert.rejects(service.sendEmail(email), /local database|non-production/); assert.equal(smtp.length + requests.length, 0); assert.equal(logs.length, 0); });
    }
});


test('sender display name is always Finix without changing the configured sender address', () => fixture({ MAIL_PROVIDER: 'smtp', SMTP_HOST: 'smtp.example.invalid', EMAIL_FROM: 'Old Name <news@finixarg.com>' }, async ({ service, smtp }) => {
    await service.sendEmail(email);
    assert.equal(smtp[0].submitted.from, 'Finix <news@finixarg.com>');
}));
test('bare sender address receives the Finix display name for Resend', () => fixture({ MAIL_PROVIDER: 'resend', RESEND_API_KEY: 'fake-api-token', EMAIL_FROM: 'news@finixarg.com' }, async ({ service, requests }) => {
    await service.sendEmail(email);
    assert.equal(JSON.parse(requests[0][1].body).from, 'Finix <news@finixarg.com>');
}));
