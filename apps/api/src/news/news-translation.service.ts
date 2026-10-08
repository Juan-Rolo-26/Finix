import { Injectable, Logger } from '@nestjs/common';
import { detect } from 'tinyld';

@Injectable()
export class NewsTranslationService {
    private readonly logger = new Logger(NewsTranslationService.name);
    private readonly timeoutMs = Math.max(1000, Number(process.env.NEWS_TRANSLATION_TIMEOUT_MS) || 4500);
    private readonly results = new Map<string, { value: string; expires: number }>();
    private readonly pending = new Map<string, Promise<string>>();
    private active = 0;
    private readonly waiters: Array<() => void> = [];

    isSpanish(text: string): boolean {
        const words = this.words(text);
        if (!words.length) return false;
        const english = new Set(['the', 'and', 'with', 'after', 'before', 'shares', 'stocks', 'earnings', 'revenue', 'acquires', 'launches', 'raises', 'reports', 'investors', 'company', 'companies', 'will', 'growth', 'prices', 'rises', 'rise', 'falls', 'fall', 'new', 'says', 'surge', 'surges']);
        if (words.filter(word => english.has(word)).length >= 2) return false;
        const language = detect(text);
        // Statistical detectors struggle with short titles dominated by ticker
        // symbols. Recognize unambiguous Spanish words, never feed metadata.
        const distinctive = new Set(['sube', 'suben', 'cae', 'caen', 'acciones', 'dólar', 'economía', 'inversión', 'ganancias', 'noticias', 'últimas', 'inversores']);
        const shortSpanish = words.length <= 6 && !['en', 'pt', 'fr', 'it', 'de'].includes(language) && words.some(word => distinctive.has(word)) && !words.some(word => english.has(word));
        if (language !== 'es' && !shortSpanish) return false;
        // Validate each sentence too: a Spanish title must not legitimize an
        // untranslated English paragraph or quote appended to the same field.
        return !String(text).split(/[.!?\n;]+/).some(part =>
            part.trim().length >= 18 && detect(part) === 'en');
    }

    isEnglish(text: string): boolean {
        const words = this.words(text);
        return words.length > 0 && detect(text) === 'en';
    }

    async translateToSpanish(text: string, sourceLanguage?: string): Promise<string> {
        const original = String(text || '').trim();
        if (!original) return '';
        if (this.isSpanish(original)) return original;

        const cached = this.results.get(original);
        if (cached && cached.expires > Date.now()) return cached.value;
        const pending = this.pending.get(original);
        if (pending) return pending;
        const request = this.translateUncached(original, sourceLanguage).then(value => {
            if (this.results.size >= 2000) this.results.delete(this.results.keys().next().value!);
            this.results.set(original, { value, expires: Date.now() + (value ? 24 * 60 * 60_000 : 10 * 60_000) });
            return value;
        }).finally(() => this.pending.delete(original));
        this.pending.set(original, request);
        return request;
    }

    private async translateUncached(original: string, sourceLanguage?: string): Promise<string> {
        if (this.active >= 8) await new Promise<void>(resolve => this.waiters.push(resolve));
        this.active++;
        try {

            // Detect the text, rather than trusting a feed's language metadata.
            const sourceCode = this.isEnglish(original) || sourceLanguage?.startsWith('en') ? 'en' : 'auto';
            const providers = [
                () => this.translateWithGoogle(original, sourceCode),
                () => this.translateWithLibreTranslate(original, sourceCode),
                () => this.translateWithMyMemory(original),
            ];

            for (const translate of providers) {
                try {
                    const translated = (await translate()).trim();
                    if (translated !== original && this.isSpanish(translated)) return translated;
                } catch (error: any) {
                    this.logger.debug(`Translation provider unavailable: ${error?.message || 'unknown error'}`);
                }
            }
            // Never fall back to the untranslated original in public news.
            return '';
        } finally {
            this.active--;
            this.waiters.shift()?.();
        }
    }

    async translateBatch(texts: string[], sourceLanguage?: string): Promise<string[]> {
        const source = String(sourceLanguage || '').trim().toLowerCase();
        if (source.startsWith('en') && texts.length > 1 && texts.every((text) => !this.isSpanish(text))) {
            const separator = 'FINIXNEWSFIELDSEPARATORQ7X';
            const combined = await this.translateToSpanish(texts.join(`\n${separator}\n`), source);
            // A failed batch already tried every provider. Avoid immediately
            // multiplying the outage into one more request per field.
            if (!combined) return texts.map(() => '');
            const parts = combined.split(separator).map((part) => part.trim());
            if (parts.length === texts.length && parts.every(part => this.isSpanish(part))) return parts;
        }
        return Promise.all(texts.map((text) => this.translateToSpanish(text, sourceLanguage)));
    }

    private words(text: string) {
        return String(text || '').toLowerCase().match(/[a-záéíóúüñ]+/g) || [];
    }

    private async translateWithGoogle(text: string, source: string): Promise<string> {
        const params = new URLSearchParams({ client: 'gtx', sl: source, tl: 'es', dt: 't', q: text });
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) throw new Error(`Google Translate returned ${response.status}`);

        const data: any = await response.json();
        const translated = Array.isArray(data?.[0])
            ? data[0].map((segment: any[]) => typeof segment?.[0] === 'string' ? segment[0] : '').join('')
            : '';
        if (!translated) throw new Error('Google Translate returned an empty result');
        return translated;
    }

    private async translateWithLibreTranslate(text: string, source: string): Promise<string> {
        const baseUrl = (process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com').replace(/\/$/, '');
        const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
        const apiKey = process.env.LIBRETRANSLATE_API_KEY;
        const body: Record<string, string> = { q: text, source, target: 'es', format: 'text' };
        if (apiKey) body.api_key = apiKey;

        const response = await fetch(`${baseUrl}/translate`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) throw new Error(`LibreTranslate returned ${response.status}`);
        const data: any = await response.json();
        if (typeof data?.translatedText !== 'string' || !data.translatedText.trim()) {
            throw new Error('LibreTranslate returned an empty result');
        }
        return data.translatedText;
    }

    private async translateWithMyMemory(text: string): Promise<string> {
        if (text.length > 500) throw new Error('Text exceeds the MyMemory free request limit');
        const params = new URLSearchParams({ q: text, langpair: 'en|es' });
        const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
            headers: { 'User-Agent': 'Finix/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) throw new Error(`MyMemory returned ${response.status}`);
        const data: any = await response.json();
        const translated = data?.responseStatus === 200 ? data?.responseData?.translatedText : null;
        if (typeof translated !== 'string' || !translated.trim()) throw new Error('MyMemory returned an empty result');
        return translated
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }
}
