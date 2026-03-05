import { Injectable, Logger } from '@nestjs/common';

export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}

@Injectable()
export class WebSearchService {
    private readonly logger = new Logger(WebSearchService.name);

    // ─── DuckDuckGo HTML scrape (no API key needed) ─────────────────────────────
    async search(query: string, maxResults = 5): Promise<WebSearchResult[]> {
        try {
            const encoded = encodeURIComponent(query);
            const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

            const res = await fetch(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (compatible; FinixBot/1.0; +https://finix.app)',
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
        } catch (err: any) {
            this.logger.warn(`Web search failed for "${query}": ${err?.message}`);
            return [];
        }
    }

    // ─── Fetch page content (first 3000 chars only to avoid huge payloads) ──────
    async fetchPageContent(url: string): Promise<string> {
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (compatible; FinixBot/1.0; +https://finix.app)',
                },
                signal: AbortSignal.timeout(8_000),
            });
            if (!res.ok) return '';
            const html = await res.text();
            return this.htmlToText(html).slice(0, 3_000);
        } catch {
            return '';
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────────
    private parseResults(html: string, max: number): WebSearchResult[] {
        const results: WebSearchResult[] = [];

        // Extract result blocks — DuckDuckGo HTML format
        const blockRegex = /<div class="result__body"[\s\S]*?<\/div>\s*<\/div>/gi;
        const titleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
        const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i;

        let m: RegExpExecArray | null;
        while ((m = blockRegex.exec(html)) !== null && results.length < max) {
            const block = m[0];
            const titleM = titleRegex.exec(block);
            const snippetM = snippetRegex.exec(block);

            if (titleM) {
                const rawUrl = titleM[1];
                const title = this.stripHtml(titleM[2]);
                const snippet = snippetM ? this.stripHtml(snippetM[1]) : '';

                // DuckDuckGo wraps URLs with a redirect prefix — extract real URL
                const realUrl = this.extractRealUrl(rawUrl);

                results.push({ title, url: realUrl, snippet });
            }
        }

        // Fallback: try simpler pattern if no blocks found
        if (results.length === 0) {
            return this.fallbackParse(html, max);
        }

        return results;
    }

    private fallbackParse(html: string, max: number): WebSearchResult[] {
        const results: WebSearchResult[] = [];
        const linkRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let m: RegExpExecArray | null;
        while ((m = linkRegex.exec(html)) !== null && results.length < max) {
            results.push({
                title: this.stripHtml(m[2]),
                url: this.extractRealUrl(m[1]),
                snippet: '',
            });
        }
        return results;
    }

    private extractRealUrl(raw: string): string {
        // DuckDuckGo sometimes uses //duckduckgo.com/l/?uddg=<encoded_url>
        try {
            if (raw.includes('uddg=')) {
                const match = raw.match(/uddg=([^&]+)/);
                if (match) return decodeURIComponent(match[1]);
            }
            if (raw.startsWith('//')) return `https:${raw}`;
            if (raw.startsWith('/')) return `https://duckduckgo.com${raw}`;
        } catch { /* ignore */ }
        return raw;
    }

    private stripHtml(html: string): string {
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

    private htmlToText(html: string): string {
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
}
