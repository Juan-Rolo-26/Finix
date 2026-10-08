const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NewsTranslationService } = require('../apps/api/dist/news/news-translation.service');
const { NewsSlotsService } = require('../apps/api/dist/news/news-slots.service');
const { NewsService } = require('../apps/api/dist/news/news.service');
const { NEWS_ARTICLES_PER_CATEGORY, DEFAULT_NEWS_CATEGORIES, DEFAULT_NEWS_SOURCES } = require('../apps/api/dist/news/news-catalog');

function translatorWith(result) {
    const translator = new NewsTranslationService();
    for (const name of ['translateWithGoogle', 'translateWithLibreTranslate', 'translateWithMyMemory']) translator[name] = async () => result;
    return translator;
}

test('language validation checks actual text, short Spanish titles and mixed paragraphs', () => {
    const translator = new NewsTranslationService();
    for (const text of ['Bitcoin sube', 'Últimas noticias de TSLA', 'Las acciones suben tras los resultados de Apple', 'La economía crece y las empresas aumentan sus inversiones']) assert.equal(translator.isSpanish(text), true, text);
    for (const text of ['Monarch acquires HMBradley', 'AAPL raises revenue guidance', 'The company reports earnings.', 'Los mercados siguen al alza. Stocks rise after earnings.', 'Los mercados and the stocks rise after earnings', 'As ações sobem após os resultados da empresa']) assert.equal(translator.isSpanish(text), false, text);
});

test('Spanish source metadata, English echoes and failed providers cannot bypass validation', async () => {
    const original = 'The company reports higher revenue after earnings';
    for (const response of [original, '', 'As ações sobem após os resultados da empresa']) {
        const translator = translatorWith(response);
        assert.equal(await translator.translateToSpanish(original, 'es'), '');
    }
    const translator = translatorWith('La empresa aumenta sus ingresos tras presentar los resultados');
    assert.equal(await translator.translateToSpanish(original, 'es'), 'La empresa aumenta sus ingresos tras presentar los resultados');
});

test('provider outages fail closed and concurrent/repeated requests share their retry backoff', async () => {
    const translator = new NewsTranslationService();
    let requests = 0;
    for (const name of ['translateWithGoogle', 'translateWithLibreTranslate', 'translateWithMyMemory']) translator[name] = async () => { requests++; throw new Error('Unavailable'); };
    const results = await Promise.all(Array.from({ length: 20 }, () => translator.translateToSpanish('Shares surge after earnings', 'en')));
    assert.ok(results.every(value => value === ''));
    assert.equal(requests, 3);
    await translator.translateToSpanish('Shares surge after earnings', 'en');
    assert.equal(requests, 3);
});

test('public slots remove untranslated titles, omit English summaries and hide raw translation fields', async () => {
    const translator = translatorWith('');
    const writes = [];
    const service = new NewsSlotsService({ newsArticle: { update: async args => writes.push(args) } }, translator);
    const english = { id: 'bad', title: 'Shares surge after earnings', titleEs: 'AAPL raises revenue guidance', source: { language: 'es' } };
    assert.equal(await service.toSpanishArticle(english), null);
    assert.equal(writes[0].data.titleEs, null);
    const spanish = await service.toSpanishArticle({ ...english, id: 'good', title: 'Las acciones suben tras los resultados', titleEs: null, description: 'The company reports revenue growth.', descriptionEs: 'The company reports revenue growth.', translationAttemptedAt: new Date() });
    assert.equal(spanish.title, 'Las acciones suben tras los resultados');
    assert.equal(spanish.description, undefined);
    assert.equal(spanish.descriptionEs, undefined);
    assert.equal(spanish.titleEs, undefined);
});

test('legacy news, ticker and trending formatter never exposes original English content', async () => {
    const service = Object.create(NewsService.prototype);
    service.translator = translatorWith('');
    service.prisma = { news: { update: async () => {} } };
    const rows = await service.formatNewsItems([
        { id: 'hidden', title: 'Shares surge after earnings', titleEs: 'Shares surge after earnings', language: 'es', source: { name: 'Publisher' } },
        { id: 'visible', title: 'Las acciones suben tras los resultados', summary: 'Shares surge after earnings', contentEs: 'The company reports earnings.', content: 'The company reports earnings.', source: { name: 'Publisher' } },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].language, 'es');
    for (const field of ['summary', 'content', 'titleOriginal']) assert.equal(rows[0][field], undefined);
});

test('every configured category expands to ten slots without overwriting existing assignments', async () => {
    assert.equal(NEWS_ARTICLES_PER_CATEGORY, 10);
    for (const category of DEFAULT_NEWS_CATEGORIES) {
        const writes = [];
        const service = new NewsSlotsService({ newsSlot: { count: async () => 5, upsert: async args => writes.push(args) } }, {});
        await service.ensureSlotsExist(category.slug, category.slug);
        assert.equal(writes.length, 10);
        assert.deepEqual(writes.map(write => write.create.position), [1,2,3,4,5,6,7,8,9,10]);
        assert.ok(writes.every(write => Object.keys(write.update).length === 0));
    }
});

test('every category has a configured native Spanish feed as well as translation support', () => {
    for (const category of DEFAULT_NEWS_CATEGORIES) assert.ok(DEFAULT_NEWS_SOURCES.some(source => source.rssUrl && source.language === 'es' && source.categories.includes(category.slug)), category.slug);
});

test('an unavailable translation batch tries each provider once and yields no untranslated fields', async () => {
    const translator = new NewsTranslationService();
    let requests = 0;
    for (const name of ['translateWithGoogle', 'translateWithLibreTranslate', 'translateWithMyMemory']) translator[name] = async () => { requests++; throw new Error('Unavailable'); };
    assert.deepEqual(await translator.translateBatch(['Shares surge after earnings', 'The company reports higher revenue.'], 'en'), ['', '']);
    assert.equal(requests, 3);
});
