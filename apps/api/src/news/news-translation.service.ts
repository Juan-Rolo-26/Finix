import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NewsTranslationService {
    private readonly logger = new Logger(NewsTranslationService.name);
    private readonly timeoutMs = Math.max(1000, Number(process.env.NEWS_TRANSLATION_TIMEOUT_MS) || 4500);

    private readonly spanishWords = new Set([
        'al', 'ante', 'con', 'como', 'cuando', 'de', 'del', 'desde', 'donde', 'durante',
        'el', 'ella', 'en', 'entre', 'esa', 'ese', 'esta', 'este', 'fue', 'ha', 'hacia',
        'las', 'los', 'más', 'menos', 'mientras', 'no', 'para', 'pero', 'por', 'que',
        'según', 'sin', 'sobre', 'tras', 'un', 'una', 'uno', 'y', 'ya', 'acciones',
        'anuncia', 'banco', 'cae', 'caen', 'dólar', 'economía', 'empresa', 'empresas',
        'mercado', 'mercados', 'sube', 'suben', 'inversores', 'inversión', 'ganancias',
    ]);

    private readonly englishWords = new Set([
        'a', 'about', 'after', 'amid', 'and', 'are', 'as', 'at', 'before', 'by', 'for',
        'from', 'has', 'have', 'in', 'into', 'is', 'its', 'market', 'markets', 'of', 'on',
        'or', 'report', 'shares', 'stocks', 'the', 'their', 'to', 'with', 'will', 'earnings',
        'revenue', 'investors', 'company', 'companies', 'rises', 'falls', 'prices', 'rate',
    ]);

    isSpanish(text: string): boolean {
        const words = this.words(text);
        if (!words.length) return false;
        const score = words.filter((word) => this.spanishWords.has(word)).length;
        const accentedChars = (text.match(/[áéíóúüñ]/gi) || []).length;
        return score >= 2 || (score >= 1 && accentedChars > 0);
    }

    isEnglish(text: string): boolean {
        const words = this.words(text);
        if (!words.length || this.isSpanish(text)) return false;
        const score = words.filter((word) => this.englishWords.has(word)).length;
        return score >= 2;
    }

    async translateToSpanish(text: string, sourceLanguage?: string): Promise<string> {
        const original = String(text || '').trim();
        if (!original) return text;

        const source = String(sourceLanguage || '').trim().toLowerCase();
        if (source === 'es' || source.startsWith('es-')) return text;
        // The source metadata can be stale or mixed (for example, an English
        // feed containing an editor-written Spanish headline). Never translate
        // text that already reads as Spanish, even when the feed says "en".
        if (this.isSpanish(original)) return text;

        const sourceCode = source.startsWith('en') ? 'en' : 'auto';
        const providers = [
            () => this.translateWithGoogle(original, sourceCode),
            () => this.translateWithLibreTranslate(original, sourceCode),
            () => this.translateWithMyMemory(original),
        ];

        for (const translate of providers) {
            try {
                const translated = (await translate()).trim();
                if (translated && translated !== original) return translated;
            } catch (error: any) {
                this.logger.debug(`Translation provider unavailable: ${error?.message || 'unknown error'}`);
            }
        }
        return text;
    }

    async translateBatch(texts: string[], sourceLanguage?: string): Promise<string[]> {
        const source = String(sourceLanguage || '').trim().toLowerCase();
        if (source.startsWith('en') && texts.length > 1 && texts.every((text) => !this.isSpanish(text))) {
            const separator = 'FINIXNEWSFIELDSEPARATORQ7X';
            const combined = await this.translateToSpanish(texts.join(`\n${separator}\n`), source);
            const parts = combined.split(separator).map((part) => part.trim());
            if (parts.length === texts.length && parts.every(Boolean)) return parts;
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
