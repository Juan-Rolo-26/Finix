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

/** Correct only known legacy wording; retain every other editor paragraph. */
export function refineRoicText(content: string) {
    return content.replace('beneficio operativo libre de impuestos (**NOPAT**)', 'beneficio operativo después de impuestos (**NOPAT**), independiente de la financiación')
        .replace('la compañía produce US$ 25 de beneficio operativo limpio cada año.', 'la compañía registra US$ 25 de beneficio operativo después de impuestos durante el período medido; no equivale a caja libre ni a retorno bursátil.')
        .replace('Cada dólar reinvertido se multiplica a una tasa superior al costo de financiarlo.', 'El retorno medido supera el costo estimado del capital. Para evaluar nuevas inversiones hay que revisar el retorno incremental y su sostenibilidad.')
        .replace('Para crecer un 10% en beneficios, la Empresa A solo necesita reinvertir una pequeña fracción de sus ganancias anuales, repartiendo el resto en recompras de acciones o dividendos. La Empresa B, en cambio, debe endeudarse fuertemente solo para mantener su posición competitiva.', 'En este ejemplo, la Empresa A obtiene mayor NOPAT con el mismo capital medido. Eso no permite concluir cuánto podrá repartir ni que la Empresa B deba endeudarse: hacen falta reinversión, capital de trabajo, vencimientos y flujos de caja. El crecimiento depende del retorno del capital nuevo y no solo del ROIC histórico.');
}
export const LEGACY_ROIC_FORMULA = 'Capital Invertido = Patrimonio Neto + Deuda Financiera − Caja Neta';
export const REFINED_ROIC_FORMULA = 'Capital Invertido (aproximación) = Patrimonio Neto + Deuda Financiera − Caja Excedente';
