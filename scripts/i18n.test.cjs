const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourceRoot = path.resolve(__dirname, '../apps/web/src');
const modules = new Map();
// Compile actual source catalogs/functions in memory. The hook's store is not
// needed by these pure tests; no browser or authenticated account is involved.
function sourceModule(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const source = fs.readFileSync(path.join(sourceRoot, file + '.ts'), 'utf8');
    const output = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function('exports', 'require', output)(exports, name => {
        if (name === '@/stores/preferencesStore') return {};
        if (name.startsWith('.')) {
            return sourceModule(path.posix.normalize(path.posix.join(path.posix.dirname(file), name)));
        }
        throw new Error('Unexpected dependency: ' + name);
    });
    return exports;
}
const { translateUi, decodeUiText, normalizeLocale } = sourceModule('i18n/index');

test('English/Spanish preferences and unsupported legacy locales have deterministic fallbacks', () => {
    assert.equal(normalizeLocale('en-US'), 'en-US');
    for (const locale of ['es-AR', 'pt-BR', '', 'invalid']) {
        assert.equal(normalizeLocale(locale), 'es-AR');
        assert.equal(translateUi('Inicio', locale), 'Inicio');
    }
    assert.equal(translateUi('Inicio', 'en-US'), 'Home');
    assert.equal(translateUi(' Guardar simulación', 'en-US'), ' Save simulation');
    assert.equal(translateUi('Texto personal fuera del catálogo', 'en-US'), 'Texto personal fuera del catálogo');
});

test('JSX catalog entities render as text in both languages without HTML interpretation', () => {
    assert.equal(translateUi('S&amp;P 500', 'es-AR'), 'S&P 500');
    assert.equal(translateUi('S&amp;P 500', 'en-US'), 'S&P 500');
    assert.equal(decodeUiText('&lt;script&gt; &#x1F4B0; &#169;'), '<script> 💰 ©');
    assert.equal(decodeUiText('&unknown; &#999999999;'), '&unknown; &#999999999;');
});

test('all eight laboratory tools have translated metadata, fields and result labels', () => {
    const { TOOLS, calculate } = sourceModule('lib/laboratory');
    assert.equal(TOOLS.length, 8);
    let checked = 0;
    for (const tool of TOOLS) {
        for (const key of ['title', 'description', 'category', 'formula', 'explanation', 'limitations']) {
            assert.notEqual(translateUi(tool[key], 'en-US'), tool[key], tool.id + ': ' + key);
            checked++;
        }
        for (const field of tool.fields) {
            assert.notEqual(translateUi(field.label, 'en-US'), field.label, tool.id + ': ' + field.key);
            checked++;
        }
        const result = calculate(tool, tool.defaults);
        for (const label of [
            ...result.metrics.map(item => item.label),
            ...result.columns.map(item => item.label),
            ...result.series.map(item => item.label),
        ]) {
            if (label === 'Capital' || label === 'Base' || label === 'Favorable') continue; // same financial labels in both languages
            assert.notEqual(translateUi(label, 'en-US'), label, tool.id + ': result ' + label);
        }
    }
    assert.ok(checked >= 90, 'Every metadata/field label is checked');
});

test('notification groups and timestamps follow the locale and calendar day', () => {
    const { groupNotificationsByDay, formatNotificationTime } = sourceModule('lib/notifications');
    const now = new Date('2026-10-13T14:00:00Z');
    const items = [
        { id: 'today', createdAt: '2026-10-13T13:00:00Z' },
        { id: 'yesterday', createdAt: '2026-10-12T13:00:00Z' },
        { id: 'invalid', createdAt: 'invalid' },
    ];
    assert.deepEqual(groupNotificationsByDay(items, { now, timeZone: 'America/Argentina/Buenos_Aires', locale: 'en-US' }).map(g => g.label), ['Today', 'Yesterday', 'No date']);
    assert.deepEqual(groupNotificationsByDay(items, { now, timeZone: 'America/Argentina/Buenos_Aires', locale: 'es-AR' }).map(g => g.label), ['Hoy', 'Ayer', 'Sin fecha']);
    assert.equal(formatNotificationTime('', 'UTC', 'en-US'), 'Date unavailable');
    assert.match(formatNotificationTime(items[0].createdAt, 'UTC', 'en-US'), /Oct/);
});
