import * as cheerio from 'cheerio';

/** Resolve publisher URLs, including relative and protocol-relative images. */
export function normalizeSourceImage(value: unknown, articleUrl: string): string | undefined {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    try {
        const url = new URL(value.trim(), articleUrl);
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined;
        // Enclosures sometimes contain a podcast or video rather than a photo.
        if (/\.(mp3|mp4|m4a|wav|ogg|webm|pdf)$/i.test(url.pathname)) return undefined;
        return url.toString();
    } catch {
        return undefined;
    }
}

export function extractHtmlNewsImage(html: string, articleUrl: string): string | undefined {
    const $ = cheerio.load(html);
    const selectors = [
        'meta[property="og:image:secure_url"]',
        'meta[property="og:image"]',
        'meta[property="og:image:url"]',
        'meta[name="twitter:image"]',
        'meta[property="twitter:image"]',
        'meta[name="twitter:image:src"]',
    ];
    for (const selector of selectors) {
        for (const element of $(selector).toArray()) {
            const image = normalizeSourceImage($(element).attr('content'), articleUrl);
            if (image) return image;
        }
    }
    // Prefer article content over navigation logos and lazy-loading placeholders.
    const contentImages = $('article img, main img').toArray();
    for (const element of [...contentImages, ...$('img').toArray()]) {
        const img = $(element);
        if (Number(img.attr('width')) === 1 || Number(img.attr('height')) === 1) continue;
        for (const attribute of ['data-src', 'data-original', 'data-lazy-src', 'src', 'data-srcset', 'srcset']) {
            const value = img.attr(attribute);
            const image = normalizeSourceImage(attribute.includes('srcset') ? value?.split(',')[0]?.trim().split(/\s+/)[0] : value, articleUrl);
            if (image) return image;
        }
    }
    return undefined;
}

export function extractRssNewsImage(item: any, articleUrl: string): string | undefined {
    const read = (value: any): string | undefined => {
        if (Array.isArray(value)) return value.map(read).find(Boolean);
        if (typeof value === 'string') return normalizeSourceImage(value, articleUrl);
        if (!value || typeof value !== 'object') return undefined;
        const type = value.type || value.$?.type || '';
        const medium = value.medium || value.$?.medium || '';
        if ((type && !String(type).startsWith('image/')) || (medium && medium !== 'image')) return undefined;
        for (const candidate of [value.url, value.href, value.$?.url, value.$?.href, value._]) {
            const image = normalizeSourceImage(candidate, articleUrl);
            if (image) return image;
        }
        return read(value['media:thumbnail']) || read(value['media:content']);
    };
    for (const value of [item.mediaContent, item.mediaThumbnail, item.mediaGroup, item['media:thumbnail'], item.enclosure, item.image, item['itunes:image']]) {
        const image = read(value);
        if (image) return image;
    }
    return extractHtmlNewsImage(item.contentEncoded || item.content || item.description || '', articleUrl);
}

export function isNewsArticleUrl(value: string): boolean {
    try {
        const url = new URL(value);
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) return false;
        const host = url.hostname.toLowerCase();
        return host.includes('.') && !/^[\d.]+$/.test(host) && !/(?:^|\.)(localhost|local|internal|test)$/.test(host);
    } catch {
        return false;
    }
}

/** Automatic image lookups stay on the configured publisher, including redirects. */
export function isPublisherArticleUrl(value: string, publisherUrls: string[]): boolean {
    if (!isNewsArticleUrl(value)) return false;
    try {
        const url = new URL(value);
        const domain = (host: string) => host.toLowerCase().replace(/^(www|feeds?|rss)\./, '');
        const host = domain(url.hostname);
        return publisherUrls.some(publisher => {
            try {
                const allowed = domain(new URL(publisher).hostname);
                return host === allowed || host.endsWith(`.${allowed}`);
            } catch {
                return false;
            }
        });
    } catch {
        return false;
    }
}
