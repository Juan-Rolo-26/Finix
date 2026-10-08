#!/usr/bin/env node
// Read an exported Auth inventory and merge only into a local rehearsal database.
const fs = require('node:fs');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const config = dotenv.parse(fs.readFileSync(process.argv[2]));
const url = new URL(config.DATABASE_URL);
if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) throw new Error('Local database required');
const users = JSON.parse(fs.readFileSync(process.argv[3]));
const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
(async () => {
    const result = await prisma.$transaction(async tx => {
        let created = 0, identities = 0, mappedByEmail = 0;
        for (const imported of users) {
            const email = imported.email?.trim().toLowerCase();
            if (!imported.id || !email) throw new Error('Export contains an account without an ID or email');
            let user = await tx.user.findUnique({ where: { id: imported.id } });
            if (!user) {
                const emailUser = await tx.user.findUnique({ where: { email } });
                if (emailUser) {
                    // Preserve Finix's existing primary key and every relation.
                    // The archive retains the original Auth ID and metadata.
                    user = emailUser;
                    mappedByEmail++;
                } else {
                const base = (imported.user_metadata?.username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 15).padEnd(3, '_');
                let username = base;
                for (let n = 1; await tx.user.findUnique({ where: { username } }); n++) username = `${base}_${n}`;
                user = await tx.user.create({ data: { id: imported.id, email, username,
                    emailVerified: Boolean(imported.email_confirmed_at),
                    createdAt: imported.created_at ? new Date(imported.created_at) : undefined,
                    avatarUrl: imported.user_metadata?.avatar_url || null,
                    password: imported.encrypted_password || null,
                } });
                created++;
                }
            }
            // Retain exported account metadata without changing existing profiles or passwords.
            const sourceIdentities = [{ provider: 'supabase-archive', subject: imported.id, metadata: imported },
                ...(imported.identities || []).map(identity => ({ provider: identity.provider,
                    subject: identity.identity_data?.sub || identity.provider_id || (identity.provider === 'email' ? imported.id : null), metadata: identity }))];
            for (const identity of sourceIdentities) {
                if (!identity.subject) throw new Error('Exported identity has no stable provider subject');
                const key = { provider: identity.provider, subject: String(identity.subject) };
                const previous = await tx.externalIdentity.findUnique({ where: { provider_subject: key } });
                if (previous && previous.userId !== user.id) throw new Error('Identity already belongs to another user');
                await tx.externalIdentity.upsert({ where: { provider_subject: key },
                    create: { ...key, userId: user.id, metadata: identity.metadata }, update: { metadata: identity.metadata } });
                identities++;
            }
        }
        return { success: true, exportedUsers: users.length, createdUsers: created, mappedByEmail, archivedIdentities: identities };
    }, { timeout: 60000 });
    console.log(JSON.stringify(result));
})().catch(error => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
