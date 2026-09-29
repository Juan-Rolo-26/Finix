const NEWS_IMAGE_LIBRARY = {
    markets: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    crypto: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=80',
    economy: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=80',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    fintech: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    commodities: 'https://images.unsplash.com/photo-1545670723-196ed0954986?auto=format&fit=crop&w=1200&q=80',
    realEstate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    startups: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
    argentina: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=1200&q=80',
} as const;

const TOPIC_IMAGES: Array<{ keywords: string[]; image: string }> = [
    { keywords: ['bitcoin', 'ethereum', 'cripto', 'crypto', 'blockchain', 'token', 'web3', 'defi'], image: NEWS_IMAGE_LIBRARY.crypto },
    { keywords: ['inteligencia artificial', 'artificial intelligence', 'machine learning', 'openai', 'nvidia', 'chip', 'semiconductor', 'tecnologia'], image: NEWS_IMAGE_LIBRARY.technology },
    { keywords: ['fintech', 'pago digital', 'pagos digitales', 'wallet', 'billetera', 'neobanco', 'mercado pago'], image: NEWS_IMAGE_LIBRARY.fintech },
    { keywords: ['petroleo', 'gas', 'oro', 'plata', 'soja', 'trigo', 'commodity', 'commodities', 'vaca muerta', 'ypf'], image: NEWS_IMAGE_LIBRARY.commodities },
    { keywords: ['inmobiliario', 'inmobiliaria', 'real estate', 'vivienda', 'hipoteca', 'propiedad'], image: NEWS_IMAGE_LIBRARY.realEstate },
    { keywords: ['startup', 'startups', 'capital de riesgo', 'venture capital', 'ronda de inversion', 'ronda de financiacion'], image: NEWS_IMAGE_LIBRARY.startups },
    { keywords: ['argentina', 'milei', 'peso argentino', 'banco central', 'bcra'], image: NEWS_IMAGE_LIBRARY.argentina },
    { keywords: ['inflacion', 'inflación', 'tasas', 'tasa de interes', 'tasa de interés', 'fed', 'pib', 'economia', 'economía', 'recesion', 'recesión'], image: NEWS_IMAGE_LIBRARY.economy },
    { keywords: ['acciones', 'bolsa', 'mercado', 'nasdaq', 'dow jones', 'sp 500', 's&p 500', 'bonos', 'dividendos'], image: NEWS_IMAGE_LIBRARY.markets },
];

const CATEGORY_IMAGES: Array<{ keywords: string[]; image: string }> = [
    { keywords: ['cripto', 'crypto', 'bitcoin'], image: NEWS_IMAGE_LIBRARY.crypto },
    { keywords: ['tecnologia', 'technology', 'ia', 'ai'], image: NEWS_IMAGE_LIBRARY.technology },
    { keywords: ['fintech', 'pagos'], image: NEWS_IMAGE_LIBRARY.fintech },
    { keywords: ['commodities', 'materias primas', 'energia', 'energía'], image: NEWS_IMAGE_LIBRARY.commodities },
    { keywords: ['inmobiliario', 'inmobiliaria', 'vivienda'], image: NEWS_IMAGE_LIBRARY.realEstate },
    { keywords: ['argentina', 'local'], image: NEWS_IMAGE_LIBRARY.argentina },
    { keywords: ['economia', 'economía', 'global', 'macro'], image: NEWS_IMAGE_LIBRARY.economy },
];

function normalizeImageText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s&.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeProvidedImage(value?: string | null) {
    if (!value) return undefined;
    const candidate = value.trim().startsWith('//') ? `https:${value.trim()}` : value.trim();
    try {
        const parsed = new URL(candidate);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : undefined;
    } catch {
        return undefined;
    }
}

/** Keeps a source image when available and guarantees a topic-relevant fallback otherwise. */
export function resolveNewsImage(title: string, categorySlug = '', providedImage?: string | null) {
    const provided = normalizeProvidedImage(providedImage);
    if (provided) return provided;

    const titleText = normalizeImageText(title);
    const topic = TOPIC_IMAGES.find(({ keywords }) => keywords.some((keyword) => titleText.includes(normalizeImageText(keyword))));
    if (topic) return topic.image;

    const categoryText = normalizeImageText(categorySlug);
    const category = CATEGORY_IMAGES.find(({ keywords }) => keywords.some((keyword) => categoryText.includes(normalizeImageText(keyword))));
    return category?.image || NEWS_IMAGE_LIBRARY.markets;
}
