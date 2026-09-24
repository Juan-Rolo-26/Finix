import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const email = String(process.env.FINIX_OFFICIAL_EMAIL || '').trim().toLowerCase();
const username = String(process.env.FINIX_OFFICIAL_USERNAME || 'finixarg').trim().toLowerCase();
const password = String(process.env.FINIX_OFFICIAL_PASSWORD || '');

async function main() {
    if (!email || !email.includes('@')) {
        throw new Error('Definí FINIX_OFFICIAL_EMAIL antes de ejecutar el script.');
    }
    if (!password || password.length < 8) {
        throw new Error('FINIX_OFFICIAL_PASSWORD debe tener al menos 8 caracteres.');
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        throw new Error('FINIX_OFFICIAL_USERNAME debe tener entre 3 y 20 caracteres alfanuméricos o _.');
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    const existingByUsername = await prisma.user.findUnique({ where: { username } });
    if (existingByUsername && existingByEmail && existingByUsername.id !== existingByEmail.id) {
        throw new Error(`El usuario @${username} ya pertenece a otra cuenta.`);
    }

    const passwordHash = await argon2.hash(password);
    const profileData = {
        email,
        username,
        password: passwordHash,
        role: 'CREATOR',
        status: 'ACTIVE',
        emailVerified: true,
        isVerified: true,
        isInfluencer: true,
        isCreator: true,
        accountType: 'CREATOR',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        onboardingCompleted: true,
        isProfilePublic: true,
        acceptingFollowers: true,
        avatarUrl: '/logo.png',
        bio: 'Cuenta oficial de Finix Argentina. Noticias, novedades y contenido oficial de la plataforma.',
        title: 'Finix Argentina · Cuenta oficial',
        company: 'Finix Argentina',
        location: 'Argentina',
        language: 'es-AR',
        currency: 'ARS',
    } as const;

    const user = existingByEmail
        ? await prisma.user.update({ where: { id: existingByEmail.id }, data: profileData })
        : await prisma.user.create({ data: profileData });

    const welcomeContent = 'Bienvenidos a Finix Argentina. Esta es la cuenta oficial para compartir novedades, actualizaciones y contenido de la plataforma.';
    const existingWelcomePost = await prisma.post.findFirst({
        where: { authorId: user.id, content: welcomeContent },
        select: { id: true },
    });

    if (!existingWelcomePost) {
        await prisma.post.create({
            data: {
                authorId: user.id,
                content: welcomeContent,
                type: 'post',
                visibility: 'VISIBLE',
                targetVisibility: 'PUBLIC',
            },
        });
    }

    console.log(`Cuenta oficial lista: @${user.username} (${user.email})`);
    console.log('La contraseña se configuró desde FINIX_OFFICIAL_PASSWORD y no se guarda en el repositorio.');
}

main()
    .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
