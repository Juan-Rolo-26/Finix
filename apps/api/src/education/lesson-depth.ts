import { LESSON_DEPTH } from './lesson-depth.data';
const bySlug = new Map(LESSON_DEPTH.map(lesson => [lesson.slug, lesson]));
export const LESSON_REVISION = 'education.depth.20261021.v1.';
export function deepenLesson(slug: string, content: string) {
    const lesson = bySlug.get(slug);
    if (!lesson) return content;
    const image = '/images/education/worked/' + slug + '.svg';
    if (content.includes(image)) return content;
    // Retire only the four obsolete invented price-path illustrations.
    const clean = content.replace(/!\[[^\]]*\]\((?:https?:\/\/[^/]+)?\/images\/education\/(?:tendencia-alcista\.jpg|tendencia-bajista\.png|tendencia-lateral\.jpg|soporte-resistencia\.png)\)[ \t]*(?:\r?\n[ \t]*\*[^\n]*\*[ \t]*)?/g, '').trim();
    return clean + '\n\n### Del concepto a una lectura más completa\n\n' + lesson.explanation +
        '\n\n![' + lesson.title + ' · Ilustración de Finix con supuestos hipotéticos](' + image + ')' +
        '\n\n### Caso resuelto: ' + lesson.title + '\n\n' + lesson.worked +
        '\n\n### Antes de sacar una conclusión\n\n' + lesson.review +
        '\n\n### Comprobá lo que aprendiste\n\n' + lesson.exercise + '\n\n**Resolución:** ' + lesson.answer;
}
export function lessonReadTime(content: string) {
    return Math.max(2, Math.ceil(content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').split(/\s+/).filter(Boolean).length / 180));
}
