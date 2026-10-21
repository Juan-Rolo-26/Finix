import { Prisma } from '@prisma/client';
import { isOfficialPublisher, renderPublicationEmail } from './publication-email';

// Stable account IDs prevent another user from enabling broadcasts by changing a handle.
export async function queueOfficialPost(tx: Prisma.TransactionClient, post: {
    id: string; authorId: string; content: string; communityId?: string | null;
    parentId?: string | null; visibility?: string; deletedAt?: Date | null;
}) {
    if (post.communityId || post.parentId || post.deletedAt || post.visibility !== 'VISIBLE') return;
    const author = await tx.user.findUnique({ where: { id: post.authorId }, select: {
        id: true, username: true, role: true, isVerified: true, status: true,
    } });
    if (!isOfficialPublisher(author)) return false;
    const title = 'Nueva publicación de FINIX';
    const message = post.content || 'FINIX compartió una nueva imagen o análisis. Entrá para verlo.';
    const ctaUrl = `${(process.env.FRONTEND_URL || 'https://finixarg.com').replace(/\/$/, '')}/posts/${post.id}`;
    const cover = await tx.postMedia.findFirst({ where: { postId: post.id, mediaType: 'image' }, orderBy: { order: 'asc' } });
    let imageUrl: string | null = null;
    if (cover) { try { const url = new URL(cover.url, process.env.FRONTEND_URL || 'https://finixarg.com'); if (['http:', 'https:'].includes(url.protocol)) imageUrl = url.href; } catch {} }
    const data = { imageUrl, sourceKey: `official-post:${post.id}`, subject: title, title, message,
        ctaUrl, ctaLabel: 'Ver publicación', audience: 'OFFICIAL',
        contentHtml: renderPublicationEmail({ message, imageUrl, ctaUrl }),
        createdById: author.id, status: 'SENDING' };
    await tx.proEmailCampaign.upsert({ where: { sourceKey: data.sourceKey }, create: data, update: {} });
    return true;
}
