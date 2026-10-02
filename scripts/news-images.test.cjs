const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { NewsFetcherService } = require('../apps/api/dist/news/news-fetcher.service');
const { extractHtmlNewsImage } = require('../apps/api/dist/news/news-source-image.util');
const { isIllustrativeNewsImage } = require('../apps/api/dist/news/news-image.util');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const source = { name: 'Publisher', rssUrl: 'https://publisher.com/feed', baseUrl: 'https://publisher.com' };
const rss = items => new Response(`<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Publisher</title><link>https://publisher.com</link><description>News</description>${items}</channel></rss>`, { headers: { 'content-type': 'application/rss+xml' } });
const item = (path, extra = '') => `<item><title>Markets ${path}</title><link>https://publisher.com/news/${path}</link><description>Market report</description>${extra}</item>`;
const html = body => new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' } });

test('RSS thumbnail and multiple media enclosures yield photos, never video or podcasts', async () => {
    let requests = 0;
    global.fetch = async () => {
        requests++;
        return rss(item('first', '<media:content url="https://cdn.publisher.com/video.mp4" type="video/mp4"/><media:content url="//cdn.publisher.com/photo.jpg" type="image/jpeg"/>') +
            item('second', '<enclosure url="https://cdn.publisher.com/audio.mp3" type="audio/mpeg"/><media:thumbnail url="/photos/thumbnail.jpg"/>'));
    };
    const articles = await new NewsFetcherService().fetchConfiguredSource(source);
    assert.deepEqual(articles.map(a => a.imageUrl), ['https://cdn.publisher.com/photo.jpg', 'https://publisher.com/photos/thumbnail.jpg']);
    assert.equal(requests, 1, 'articles that have RSS photos need no extra network requests');
});

test('missing RSS photos are recovered from the original article and cached', async () => {
    const calls = [];
    global.fetch = async url => {
        calls.push(url);
        return url === source.rssUrl ? rss(item('earnings')) : html('<meta property="og:image" content="../photos/earnings.jpg">');
    };
    const fetcher = new NewsFetcherService();
    for (let round = 0; round < 2; round++) {
        const articles = await fetcher.fetchConfiguredSource(source);
        assert.equal(articles[0].imageUrl, 'https://publisher.com/photos/earnings.jpg');
    }
    assert.equal(calls.filter(url => url.endsWith('/earnings')).length, 1);
});

test('source photos come first and text-only articles receive a related image automatically', async () => {
    global.fetch = async url => {
        if (url === source.rssUrl) return rss(item('no-photo') + item('unavailable') + item('illustrated', '<media:content url="https://cdn.publisher.com/market.jpg" type="image/jpeg"/>'));
        if (url.endsWith('/unavailable')) throw new Error('timeout');
        return html('<h1>Text-only article</h1>');
    };
    const articles = await new NewsFetcherService().fetchConfiguredSource(source);
    assert.equal(articles.length, 3);
    assert.ok(articles[0].url.endsWith('/illustrated'));
    assert.ok(articles.slice(1).every(article => isIllustrativeNewsImage(article.imageUrl)));
});

test('automatic metadata requests reject off-publisher links and unsafe redirects', async () => {
    const calls = [];
    global.fetch = async url => {
        calls.push(url);
        if (url === source.rssUrl) return rss(item('redirect') + '<item><title>External</title><link>http://127.0.0.1/internal</link></item>');
        return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/internal' } });
    };
    const articles = await new NewsFetcherService().fetchConfiguredSource(source);
    assert.equal(articles.length, 1, 'internal article URLs must not be imported');
    assert.ok(isIllustrativeNewsImage(articles[0].imageUrl), 'the public article gets an image without following the unsafe redirect');
    assert.deepEqual(calls, [source.rssUrl, 'https://publisher.com/news/redirect']);
});

test('publisher redirects resolve relative photos against the final article URL', async () => {
    global.fetch = async url => {
        if (url === source.rssUrl) return rss(item('old'));
        if (url.endsWith('/old')) return new Response(null, { status: 301, headers: { location: '/updated/story/' } });
        return html('<meta name="twitter:image" content="photo.jpg">');
    };
    assert.equal((await new NewsFetcherService().fetchConfiguredSource(source))[0].imageUrl, 'https://publisher.com/updated/story/photo.jpg');
});

test('metadata alternatives and lazy article photos override invalid placeholders and navigation logos', () => {
    assert.equal(extractHtmlNewsImage('<meta property="og:image" content="data:image/png;base64,AAA"><meta name="twitter:image" content="//cdn.publisher.com/social.jpg">', 'https://publisher.com/story'), 'https://cdn.publisher.com/social.jpg');
    assert.equal(extractHtmlNewsImage('<img src="/logo.png"><article><img width="1" height="1" src="/pixel.gif"><img src="data:image/gif;base64,AAA" data-src="photos/article.webp"></article>', 'https://publisher.com/news/story'), 'https://publisher.com/news/photos/article.webp');
});

test('API sources recover original photos first and add related photos to the remaining news', async () => {
    global.fetch = async url => url === 'https://publisher.com/api'
        ? Response.json([{ title: 'Earnings', url: 'https://publisher.com/earnings' }, { title: 'No photo', url: 'https://publisher.com/empty' }])
        : html(url.endsWith('/earnings') ? '<meta property="og:image:url" content="/earnings.jpg">' : '<p>Text only</p>');
    const articles = await new NewsFetcherService().fetchConfiguredSource({ ...source, rssUrl: null, apiUrl: 'https://publisher.com/api' });
    assert.equal(articles.length, 2);
    assert.equal(articles[0].imageUrl, 'https://publisher.com/earnings.jpg');
    assert.ok(isIllustrativeNewsImage(articles[1].imageUrl));
});
