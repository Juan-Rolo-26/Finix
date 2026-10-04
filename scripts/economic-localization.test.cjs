// Build @finix/shared first: node --test scripts/economic-localization.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    formatEconomicEventTitle: title,
    formatEconomicEventDescription: description,
    localizeEconomicEvent: localize,
} = require('../packages/shared/dist');

test('Screenshot events have complete Spanish names and accurate descriptions', () => {
    assert.equal(title('MBA Mortgage Refinance Index'), 'Índice de refinanciación hipotecaria (MBA)');
    assert.match(description('MBA Mortgage Refinance Index', 'The MBA Weekly Mortgage Application Survey is a comprehensive overview of the nationwide mortgage market.'), /refinanciación/);
    assert.equal(title('ADP Employment Change'), 'Variación del empleo privado (ADP)');
    assert.match(description('ADP Employment Change'), /mensual/);
    assert.match(description('ADP Employment Change Weekly'), /semanal/);
    assert.equal(title('GDP Sales QoQ Final'), 'Ventas finales de la producción interna · variación trimestral · dato definitivo');
    assert.match(description('GDP Sales QoQ Final', 'Valor monetario total de bienes y servicios finales producidos en el período.'), /inventarios/);
    assert.equal(title('Goods Trade Balance Adv'), 'Balanza comercial de bienes · estimación preliminar');
    assert.doesNotMatch(description('Goods Trade Balance Adv'), /servicios/);
});

test('Unknown or partly translated provider text cannot leak English', () => {
    for (const text of ['The new survey measures activity.', 'La encuesta is a comprehensive overview of the market.', 'Mide the market activity en Argentina.']) {
        assert.equal(description('New Experimental Survey', text), 'Publicación de información económica. Consultá la fuente para conocer el detalle del indicador.');
    }
    assert.equal(title('New Experimental Survey'), 'Publicación económica');
    assert.equal(title('GDP Sales unexpected English suffix'), 'Publicación económica');
    assert.equal(title('Fed An Unknown English Speaker Speech'), 'Discurso de la Reserva Federal');
    assert.equal(title('New Experimental Survey', 'AR'), 'Publicación económica de Argentina');
    assert.doesNotMatch(description('New Experimental Survey', undefined, 'BR'), /EE\. UU\.|Argentina/);
});

test('Spanish explanations, regional context and translated qualifiers survive repeated formatting', () => {
    const spanish = 'Mide la evolución de la producción del sector industrial durante el período informado.';
    assert.equal(description('Indicador de producción', spanish), spanish);
    assert.match(description('Inflation Rate YoY', 'Dato clave que guía la política monetaria de la Fed.', 'AR'), /hogares en Argentina/);
    for (const raw of ['GDP Sales QoQ Final', 'ADP Employment Change Weekly', '17-Week Bill Auction', '30-Year Bond Auction', 'Fed Powell Speech', 'Retail Sales MoM SA', 'CPI YoY (Sep)']) {
        const translated = title(raw);
        assert.equal(title(translated), translated, raw);
    }
    assert.match(title('17-Week Bill Auction'), /17 semanas/);
    assert.match(title('30-Year Bond Auction'), /30 años/);
    assert.match(title('Retail Sales MoM SA'), /variación mensual · ajustado estacionalmente/);
    assert.match(title('CPI YoY (Sep)'), /variación interanual · período: septiembre/);
});

test('Read-time localization leaves provider identity, dates, URLs and financial figures intact', () => {
    const original = { id: 'provider-123', title: 'MBA Mortgage Refinance Index', description: 'The market is represented by the survey.', country: 'US', date: '2026-10-01', actualValue: '557.8', previousValue: '61.1', unit: '', source: 'TradingView Economic Calendar', sourceUrl: 'https://example.com/source' };
    const translated = localize(original);
    assert.equal(translated.source, 'Calendario económico de TradingView');
    const { title: a, description: b, source: c, ...preserved } = translated;
    const { title: d, description: e, source: f, ...expected } = original;
    assert.deepEqual(preserved, expected);
    assert.equal(original.title, 'MBA Mortgage Refinance Index');
    assert.deepEqual(localize(translated), translated);
});
