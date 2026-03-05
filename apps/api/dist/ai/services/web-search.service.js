"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WebSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchService = void 0;
const common_1 = require("@nestjs/common");
let WebSearchService = WebSearchService_1 = class WebSearchService {
    constructor() {
        this.logger = new common_1.Logger(WebSearchService_1.name);
    }
    async search(query, maxResults = 5) {
        try {
            const encoded = encodeURIComponent(query);
            const url = `https://html.duckduckgo.com/html/?q=${encoded}`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FinixBot/1.0; +https://finix.app)',
                    Accept: 'text/html',
                },
                signal: AbortSignal.timeout(10_000),
            });
            if (!res.ok) {
                this.logger.warn(`DuckDuckGo returned ${res.status} for query: ${query}`);
                return [];
            }
            const html = await res.text();
            return this.parseResults(html, maxResults);
        }
        catch (err) {
            this.logger.warn(`Web search failed for "${query}": ${err?.message}`);
            return [];
        }
    }
    async fetchPageContent(url) {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FinixBot/1.0; +https://finix.app)',
                },
                signal: AbortSignal.timeout(8_000),
            });
            if (!res.ok)
                return '';
            const html = await res.text();
            return this.htmlToText(html).slice(0, 3_000);
        }
        catch {
            return '';
        }
    }
    parseResults(html, max) {
        const results = [];
        const blockRegex = /<div class="result__body"[\s\S]*?<\/div>\s*<\/div>/gi;
        const titleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
        const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i;
        let m;
        while ((m = blockRegex.exec(html)) !== null && results.length < max) {
            const block = m[0];
            const titleM = titleRegex.exec(block);
            const snippetM = snippetRegex.exec(block);
            if (titleM) {
                const rawUrl = titleM[1];
                const title = this.stripHtml(titleM[2]);
                const snippet = snippetM ? this.stripHtml(snippetM[1]) : '';
                const realUrl = this.extractRealUrl(rawUrl);
                results.push({ title, url: realUrl, snippet });
            }
        }
        if (results.length === 0) {
            return this.fallbackParse(html, max);
        }
        return results;
    }
    fallbackParse(html, max) {
        const results = [];
        const linkRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        while ((m = linkRegex.exec(html)) !== null && results.length < max) {
            results.push({
                title: this.stripHtml(m[2]),
                url: this.extractRealUrl(m[1]),
                snippet: '',
            });
        }
        return results;
    }
    extractRealUrl(raw) {
        try {
            if (raw.includes('uddg=')) {
                const match = raw.match(/uddg=([^&]+)/);
                if (match)
                    return decodeURIComponent(match[1]);
            }
            if (raw.startsWith('//'))
                return `https:${raw}`;
            if (raw.startsWith('/'))
                return `https://duckduckgo.com${raw}`;
        }
        catch { }
        return raw;
    }
    stripHtml(html) {
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    htmlToText(html) {
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
};
exports.WebSearchService = WebSearchService;
exports.WebSearchService = WebSearchService = WebSearchService_1 = __decorate([
    (0, common_1.Injectable)()
], WebSearchService);
//# sourceMappingURL=web-search.service.js.map