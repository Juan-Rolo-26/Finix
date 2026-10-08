const test = require('node:test');
const assert = require('node:assert/strict');
const { JwtService } = require('@nestjs/jwt');
const { GoogleAuthService } = require('../apps/api/dist/auth/google-auth.service');
const { AuthService } = require('../apps/api/dist/auth/auth.service');
const { isLocalMode } = require('../apps/api/dist/config/local-mode');
const { AdminAuthService } = require('../apps/api/dist/admin/admin-auth.service');
const secret = 'local-google-flow-test-secret-at-least-32-characters';

test('Admin email delivery errors are returned instead of claiming a code was sent', async () => {
    const service = Object.create(AdminAuthService.prototype);
    service.mailService = { getAdminNotificationEmail: () => 'owner@example.invalid', sendAdmin2faCode: async () => { throw new Error('Resend rejected delivery'); } };
    await assert.rejects(service.sendAdminEmailNotification('123456'), /Resend rejected delivery/);
});

test('Google callback rejects a mismatched state before exchanging credentials', async () => {
    const jwt = new JwtService({ secret });
    const service = new GoogleAuthService(jwt, {});
    const cookie = await jwt.signAsync({ purpose: 'google-login', state: 'original' }, { issuer: 'finix-api', audience: 'google-login', expiresIn: '10m' });
    await assert.rejects(service.finish('code', 'different', cookie), /inválida/);
    await assert.rejects(service.finish('code', 'original', cookie + 'tampered'));
    await assert.rejects(service.finish('code', 'original', ''));
});

test('Google callback checks nonce and verified email after library verification', async () => {
    const jwt = new JwtService({ secret });
    const service = new GoogleAuthService(jwt, {});
    const flow = { purpose: 'google-login', state: 'state', nonce: 'expected', codeVerifier: 'verifier' };
    const cookie = await jwt.signAsync(flow, { issuer: 'finix-api', audience: 'google-login', expiresIn: '10m' });
    let payload = { sub: 'google-sub', email: 'test@example.invalid', email_verified: true, nonce: 'wrong' };
    service.client = () => ({ getToken: async options => { assert.equal(options.codeVerifier, 'verifier'); return { tokens: { id_token: 'id-token' } }; }, verifyIdToken: async () => ({ getPayload: () => payload }) });
    service.resolveIdentity = async identity => identity;
    await assert.rejects(service.finish('code', 'state', cookie), /verificar/);
    payload = { ...payload, nonce: 'expected', email_verified: false };
    await assert.rejects(service.finish('code', 'state', cookie), /verificar/);
    payload = { ...payload, email_verified: true };
    assert.equal((await service.finish('code', 'state', cookie)).sub, 'google-sub');
});

test('Imported Google identities keep the existing Finix ID and account relations', async () => {
    const user = { id: 'original-finix-id' };
    const transaction = { externalIdentity: { findUnique: async () => ({ user, userId: user.id }) } };
    const service = new GoogleAuthService({}, { $transaction: fn => fn(transaction) });
    assert.equal((await service.resolveIdentity({ sub: 'stable-google-id', email: 'test@example.invalid', email_verified: true })).id, user.id);
    await assert.rejects(service.resolveIdentity({ sub: 'stable-google-id', email: 'test@example.invalid', email_verified: true }, undefined, 'another-account'));
});

test('Email coincidence cannot silently link Google to an existing account', async () => {
    let linked = 0;
    const user = { id: 'existing-id', email: 'test@example.invalid' };
    const transaction = { externalIdentity: { findUnique: async () => null, create: async () => { linked++; } }, user: { findUnique: async () => user } };
    const service = new GoogleAuthService({}, { $transaction: fn => fn(transaction) });
    const identity = { sub: 'google-id', email: user.email, email_verified: true };
    await assert.rejects(service.resolveIdentity(identity), /Ya existe/);
    assert.equal(linked, 0);
    assert.equal((await service.resolveIdentity(identity, undefined, user.id)).id, user.id);
    assert.equal(linked, 1);
});

test('Both imported bcrypt and existing Argon2 passwords verify without conversion', async () => {
    const service = Object.create(AuthService.prototype);
    for (const hash of [await require('argon2').hash('correct-password'), await require('bcryptjs').hash('correct-password', 4)]) {
        assert.equal(service.getManagedPasswordHash({ password: hash }), hash);
        assert.equal(await service.verifyPassword(hash, 'correct-password'), true);
        assert.equal(await service.verifyPassword(hash, 'wrong-password'), false);
    }
    assert.equal(service.getManagedPasswordHash({ password: 'plaintext' }), null);
});

test('Local rehearsal mode rejects remote databases and production', () => {
    const original = { FINIX_LOCAL_MODE: process.env.FINIX_LOCAL_MODE, DATABASE_URL: process.env.DATABASE_URL, NODE_ENV: process.env.NODE_ENV };
    try {
        Object.assign(process.env, { FINIX_LOCAL_MODE: 'true', DATABASE_URL: 'postgresql://test@remote.example/finix', NODE_ENV: 'development' });
        assert.throws(isLocalMode, /local database/);
        process.env.DATABASE_URL = 'postgresql://test@127.0.0.1:15432/finix_prod';
        assert.equal(isLocalMode(), true);
        process.env.NODE_ENV = 'production';
        assert.throws(isLocalMode, /non-production/);
    } finally {
        for (const [key, value] of Object.entries(original)) value === undefined ? delete process.env[key] : process.env[key] = value;
    }
});
