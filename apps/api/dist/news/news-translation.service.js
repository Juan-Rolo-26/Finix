"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsTranslationService = void 0;
const common_1 = require("@nestjs/common");
let NewsTranslationService = class NewsTranslationService {
    isEnglish(text) {
        if (!text)
            return false;
        const englishIndicators = [
            'the', 'and', 'is', 'are', 'was', 'were', 'have', 'has',
            'will', 'would', 'could', 'should', 'can', 'may', 'might',
            'stock', 'market', 'earnings', 'revenue', 'shares', 'investors'
        ];
        const lowerText = text.toLowerCase();
        const matches = englishIndicators.filter(word => lowerText.includes(` ${word} `) ||
            lowerText.startsWith(`${word} `) ||
            lowerText.endsWith(` ${word}`));
        return matches.length >= 3;
    }
    async translateToSpanish(text) {
        if (!text || !this.isEnglish(text)) {
            return text;
        }
        try {
            const translated = await this.translateWithLibreTranslate(text);
            if (translated && translated !== text) {
                return translated;
            }
        }
        catch (error) {
            console.warn('[Translation] LibreTranslate failed:', error.message);
        }
        try {
            const translated = await this.translateWithMyMemory(text);
            if (translated && translated !== text) {
                return translated;
            }
        }
        catch (error) {
            console.warn('[Translation] MyMemory failed:', error.message);
        }
        return text;
    }
    async translateWithLibreTranslate(text) {
        try {
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
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) {
                throw new Error(`LibreTranslate returned ${response.status}`);
            }
            const data = await response.json();
            return data.translatedText || text;
        }
        catch (error) {
            throw new Error(`LibreTranslate error: ${error.message}`);
        }
    }
    async translateWithMyMemory(text) {
        try {
            const truncated = text.substring(0, 500);
            const params = new URLSearchParams({
                q: truncated,
                langpair: 'en|es',
            });
            const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) {
                throw new Error(`MyMemory returned ${response.status}`);
            }
            const data = await response.json();
            if (data.responseStatus === 200 && data.responseData) {
                return data.responseData.translatedText || text;
            }
            throw new Error('MyMemory translation failed');
        }
        catch (error) {
            throw new Error(`MyMemory error: ${error.message}`);
        }
    }
    async translateBatch(texts) {
        const results = [];
        for (let i = 0; i < texts.length; i++) {
            const translated = await this.translateToSpanish(texts[i]);
            results.push(translated);
            if (i < texts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return results;
    }
    basicFinancialTranslation(text) {
        const translations = {
            'stock market': 'mercado de valores',
            'stock': 'acción',
            'shares': 'acciones',
            'earnings': 'ganancias',
            'revenue': 'ingresos',
            'profit': 'beneficio',
            'loss': 'pérdida',
            'bitcoin': 'bitcoin',
            'ethereum': 'ethereum',
            'cryptocurrency': 'criptomoneda',
            'blockchain': 'blockchain',
            'inflation': 'inflación',
            'interest rate': 'tasa de interés',
            'central bank': 'banco central',
            'federal reserve': 'Reserva Federal',
            'GDP': 'PIB',
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
};
exports.NewsTranslationService = NewsTranslationService;
exports.NewsTranslationService = NewsTranslationService = __decorate([
    (0, common_1.Injectable)()
], NewsTranslationService);
//# sourceMappingURL=news-translation.service.js.map