import { Injectable } from '@nestjs/common';

/**
 * Service for translating news content from English to Spanish
 * Uses free translation methods with fallback options
 */
@Injectable()
export class NewsTranslationService {
    /**
     * Detect if text is in English
     */
    isEnglish(text: string): boolean {
        if (!text) return false;

        // Common English words that rarely appear in Spanish
        const englishIndicators = [
            'the', 'and', 'is', 'are', 'was', 'were', 'have', 'has',
            'will', 'would', 'could', 'should', 'can', 'may', 'might',
            'stock', 'market', 'earnings', 'revenue', 'shares', 'investors'
        ];

        const lowerText = text.toLowerCase();
        const matches = englishIndicators.filter(word =>
            lowerText.includes(` ${word} `) ||
            lowerText.startsWith(`${word} `) ||
            lowerText.endsWith(` ${word}`)
        );

        // If we find multiple English indicators, it's likely English
        return matches.length >= 3;
    }

    /**
     * Translate text from English to Spanish using Libretranslate (free API)
     * Fallback to MyMemory API if Libretranslate fails
     */
    async translateToSpanish(text: string): Promise<string> {
        if (!text || !this.isEnglish(text)) {
            return text;
        }

        try {
            // Try LibreTranslate first (community instance)
            const translated = await this.translateWithLibreTranslate(text);
            if (translated && translated !== text) {
                return translated;
            }
        } catch (error) {
            console.warn('[Translation] LibreTranslate failed:', error.message);
        }

        try {
            // Fallback to MyMemory (free tier)
            const translated = await this.translateWithMyMemory(text);
            if (translated && translated !== text) {
                return translated;
            }
        } catch (error) {
            console.warn('[Translation] MyMemory failed:', error.message);
        }

        // If all fails, return original
        return text;
    }

    /**
     * Translate using LibreTranslate community instance
     */
    private async translateWithLibreTranslate(text: string): Promise<string> {
        try {
            // Use public LibreTranslate instance
            const response = await fetch('https://libretranslate.com/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    source: 'en',
                    target: 'es',
                    format: 'text',
                }),
                signal: AbortSignal.timeout(10000), // 10s timeout
            });

            if (!response.ok) {
                throw new Error(`LibreTranslate returned ${response.status}`);
            }

            const data = await response.json();
            return data.translatedText || text;
        } catch (error) {
            throw new Error(`LibreTranslate error: ${error.message}`);
        }
    }

    /**
     * Translate using MyMemory API (free tier: 10,000 chars/day)
     */
    private async translateWithMyMemory(text: string): Promise<string> {
        try {
            // Limit text length for free tier
            const truncated = text.substring(0, 500);

            const params = new URLSearchParams({
                q: truncated,
                langpair: 'en|es',
            });

            const response = await fetch(
                `https://api.mymemory.translated.net/get?${params.toString()}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                    },
                    signal: AbortSignal.timeout(10000),
                }
            );

            if (!response.ok) {
                throw new Error(`MyMemory returned ${response.status}`);
            }

            const data = await response.json();

            if (data.responseStatus === 200 && data.responseData) {
                return data.responseData.translatedText || text;
            }

            throw new Error('MyMemory translation failed');
        } catch (error) {
            throw new Error(`MyMemory error: ${error.message}`);
        }
    }

    /**
     * Batch translate multiple texts (with rate limiting)
     */
    async translateBatch(texts: string[]): Promise<string[]> {
        const results: string[] = [];

        for (let i = 0; i < texts.length; i++) {
            const translated = await this.translateToSpanish(texts[i]);
            results.push(translated);

            // Add delay to avoid rate limiting
            if (i < texts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Simple rule-based translation for common financial terms
     * Used as ultrafast fallback
     */
    private basicFinancialTranslation(text: string): string {
        const translations: Record<string, string> = {
            // Markets
            'stock market': 'mercado de valores',
            'stock': 'acción',
            'shares': 'acciones',
            'earnings': 'ganancias',
            'revenue': 'ingresos',
            'profit': 'beneficio',
            'loss': 'pérdida',

            // Crypto
            'bitcoin': 'bitcoin',
            'ethereum': 'ethereum',
            'cryptocurrency': 'criptomoneda',
            'blockchain': 'blockchain',

            // Economy
            'inflation': 'inflación',
            'interest rate': 'tasa de interés',
            'central bank': 'banco central',
            'federal reserve': 'Reserva Federal',
            'GDP': 'PIB',

            // Companies
            'CEO': 'director ejecutivo',
            'company': 'empresa',
            'investor': 'inversor',
            'investment': 'inversión',
        };

        let translated = text;
        for (const [en, es] of Object.entries(translations)) {
            const regex = new RegExp(`\\b${en}\\b`, 'gi');
            translated = translated.replace(regex, es);
        }

        return translated;
    }
}
