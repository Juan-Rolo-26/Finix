import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as Parser from 'rss-parser';
import { PrismaService } from '../prisma.service';
import { NewsTranslationService } from '../news/news-translation.service';

const SOURCE_AR = /ámbito|ambito|cronista|infobae|la nación|la nacion|clarín|clarin|iprofesional|perfil|bcra|indec/i;
const SOURCE_US = /reuters|associated press|ap news|bloomberg|cnbc|marketwatch|nasdaq|yahoo finance|wall street journal|financial times|nyt economy|bbc business|investing/i;
const AR_TOPIC = /argentin|merval|bcra|indec|byma|buenos aires|dólar|dolar|milei|caputo|cepo|riesgo pa[ií]s|lecap|ypf|galicia|pampa/i;
// Match the headline itself. Generic words such as stocks, bank or markets,
// and syndicated show descriptions, do not establish a US market connection.
const US_TOPIC = /wall street|s&p\s*500|nasdaq|dow jones|russell\s*2000|united states|estados unidos|\bu\.s\.|\bus\s+(?:stocks|markets|economy)|\bee\.?\s*uu\b|estadounidens|federal reserve|reserva federal|\bfed\b|\bnyse\b|apple|microsoft|nvidia|amazon|alphabet|\bgoogle\b|\bmeta\b|tesla|spacex|jpmorgan|goldman sachs|morgan stanley|bank of america|wells fargo|citigroup|berkshire|walmart|costco|home depot|procter|coca.cola|pepsico|mcdonald|netflix|disney|broadcom|qualcomm|micron|\bintel\b|\bamd\b|oracle|adobe|salesforce|palantir|cisco|ibm|exxon|chevron|boeing|caterpillar|johnson.{0,5}johnson|eli lilly|pfizer|merck|unitedhealth|general motors|\bford\b|\bvisa\b|mastercard|american express|blackrock/i;
const SHOW_DESCRIPTION = /is your (?:definitive )?source|es su fuente definitiva|es tu fuente|le ofrece todo lo que necesita saber|bring you (?:insights|the latest)|te (?:traemos|ofrecemos) (?:las \u00faltimas|noticias)|bloomberg.{0,30}(?:the china show|the asia trade)/i;
const clean = (value: unknown) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const normalized = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export type NewsletterStory = { title: string; description: string; sourceName: string; url: string; publishedAt: Date };

@Injectable()
export class NewsletterNewsService {
    constructor(private readonly prisma: PrismaService, private readonly translator: NewsTranslationService) {}

    async getHighlights(now = new Date()) {
        const since = new Date(now.getTime() - 72 * 3600000);
        const fields = { id: true, title: true, titleEs: true, description: true, descriptionEs: true, sourceName: true, sourceUrl: true, url: true, publishedAt: true };
        const base = { isActive: true, isPublished: true, status: 'PUBLISHED', publishedAt: { gte: since, lte: now } };
        // Independent source pools prevent high-volume international feeds from
        // crowding all Argentine stories out of a shared top-N query.
        const [argentinaPool, usPool] = await Promise.all([
            this.prisma.newsArticle.findMany({ where: { ...base, OR: ['Ámbito','Ambito','Cronista','Infobae','Nación','Nacion','Clarín','Clarin','iProfesional','Perfil','BCRA','INDEC'].map(name => ({ sourceName: { contains: name, mode: 'insensitive' as const } })) }, select: fields, orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }], take: 100 }),
            this.prisma.newsArticle.findMany({ where: { ...base, OR: ['Reuters','Associated Press','AP News','Bloomberg','CNBC','MarketWatch','Nasdaq','Yahoo Finance','Wall Street Journal','Financial Times','NYT Economy','BBC Business','Investing'].map(name => ({ sourceName: { contains: name, mode: 'insensitive' as const } })) }, select: fields, orderBy: [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }], take: 100 }),
        ]);
        const usedUrls = new Set<string>(), usedTitles = new Set<string>();
        const select = async (pool: any[], region: 'AR' | 'US', selected: NewsletterStory[]) => {
            for (const article of pool) {
                if (selected.length >= 4) break;
                const source = clean(article.sourceName || article.source);
                const topic = clean([article.title, article.titleEs, article.description, article.descriptionEs].join(' '));
                const headline = clean([article.title, article.titleEs].join(' '));
                if (!(region === 'AR' ? SOURCE_AR.test(source) && AR_TOPIC.test(topic) : SOURCE_US.test(source) && US_TOPIC.test(headline))) continue;
                let url: URL;
                try { url = new URL(article.url || article.sourceUrl); if (url.protocol !== 'https:') continue; } catch { continue; }
                ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key => url.searchParams.delete(key));
                const date = new Date(article.publishedAt);
                if (!Number.isFinite(date.getTime()) || date < since || date > now) continue;
                if (usedUrls.has(url.href)) continue;
                let title = clean(article.titleEs);
                if (!this.translator.isSpanish(title)) title = clean(article.title);
                if (!this.translator.isSpanish(title)) title = await this.translator.translateToSpanish(title);
                if (!this.translator.isSpanish(title)) continue;
                const key = normalized(title);
                if (usedTitles.has(key)) continue;
                let description = clean(article.descriptionEs);
                if (!this.translator.isSpanish(description)) description = clean(article.description);
                if (description && !this.translator.isSpanish(description)) description = await this.translator.translateToSpanish(description.slice(0, 700));
                if (!this.translator.isSpanish(description) || SHOW_DESCRIPTION.test(description)) description = 'Consultá la noticia completa en la fuente original.';
                usedUrls.add(url.href); usedTitles.add(key);
                selected.push({ title, description: description.slice(0, 400), sourceName: source, url: url.href, publishedAt: date });
                // Persist only verified Spanish translations for later sends.
                if (article.id && (article.titleEs !== title || article.descriptionEs !== description)) {
                    await this.prisma.newsArticle.update({ where: { id: article.id }, data: { titleEs: title, descriptionEs: description, translationAttemptedAt: new Date() } }).catch(() => undefined);
                }
            }
        };
        const argentina: NewsletterStory[] = [], unitedStates: NewsletterStory[] = [];
        await select(argentinaPool, 'AR', argentina);
        await select(usPool, 'US', unitedStates);
        if (argentina.length < 4 || unitedStates.length < 4) {
            const parser = new Parser({ timeout: 6500 });
            const feeds = [
                { region: 'AR' as const, name: 'Ámbito Finanzas', url: 'https://www.ambito.com/rss/finanzas.xml' },
                { region: 'AR' as const, name: 'Ámbito Financiero', url: 'https://www.ambito.com/rss/economia.xml' },
                { region: 'US' as const, name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
                { region: 'US' as const, name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
            ].filter(feed => (feed.region === 'AR' ? argentina : unitedStates).length < 4);
            const fetched = await Promise.allSettled(feeds.map(async feed => ({ ...feed, data: await parser.parseURL(feed.url) })));
            for (const result of fetched) {
                if (result.status !== 'fulfilled') continue;
                const { region, name, data } = result.value;
                const pool = data.items.map(item => ({ title: item.title, description: clean(item.contentSnippet || item.content || ''), url: item.link, publishedAt: item.isoDate || item.pubDate, sourceName: name }));
                await select(pool, region, region === 'AR' ? argentina : unitedStates);
            }
        }
        if (argentina.length < 4 || unitedStates.length < 4) {
            throw new ServiceUnavailableException(`El boletín se reintentará: hay ${argentina.length}/4 noticias de Argentina y ${unitedStates.length}/4 de Estados Unidos verificadas en español.`);
        }
        return { argentina, unitedStates };
    }
}
