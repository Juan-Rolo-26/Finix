import { usePreferencesStore } from '@/stores/preferencesStore';
import { en } from './en';
import { es } from './es';
import { uiEnglish } from './ui';
import { settingsUi } from './settingsUi';
import { pagesUiExtra } from './pagesUiExtra';
import { pagesUi } from './pagesUi';
import { legalUi } from './legalUi';
import { metadataUi } from './metadataUi';

const authoredUi = { ...pagesUi, ...pagesUiExtra, ...uiEnglish, ...settingsUi, ...legalUi, ...metadataUi };
export type Translation = typeof es;
export type SupportedLocale = 'es-AR' | 'en-US';
export const normalizeLocale = (language: string): SupportedLocale => language === 'en-US' ? 'en-US' : 'es-AR';

export function decodeUiText(text: string): string {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: String.fromCharCode(34), apos: String.fromCharCode(39), nbsp: '\u00a0', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', rarr: '→', larr: '←', mdash: '—', ndash: '–', hellip: '…', copy: '©' };
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
        if (code.startsWith('#')) {
            const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
        }
        return named[code] ?? entity;
    });
}
export function translateUi(text: string, language: string): string {
    if (normalizeLocale(language) !== 'en-US') return decodeUiText(text);
    const translated = authoredUi[text];
    if (translated) return decodeUiText(translated);
    const trimmed = authoredUi[text.trim()];
    if (trimmed) return decodeUiText(text.replace(text.trim(), trimmed));
    const range = /^Ingresá un valor entre (.+) y (.+)\.$/.exec(text);
    if (range) return `Enter a value between ${range[1]} and ${range[2]}.`;
    return decodeUiText(text);
}
export const useTranslation = (): Translation & { lang: SupportedLocale; locale: SupportedLocale; ui: (text: string) => string } => {
    const language = usePreferencesStore(state => state.language);
    const lang = normalizeLocale(language);
    return { ...(lang === 'en-US' ? en : es), lang, locale: lang, ui: text => translateUi(text, lang) } as Translation & { lang: SupportedLocale; locale: SupportedLocale; ui: (text: string) => string };
};
