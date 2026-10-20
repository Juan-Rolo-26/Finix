/** Replace the former teaching diagrams in every lesson with its real market chart. */
export function removeIllustratedLessonCharts(content: string) {
    return content.replace(/!\[[^\]]*\]\((?:https?:\/\/[^/]+)?\/images\/education\/(?:tendencia-alcista\.jpg|tendencia-bajista\.png|tendencia-lateral\.jpg|soporte-resistencia\.png)\)[ \t]*(?:\r?\n[ \t]*\*[^\n]*\*[ \t]*)?/g, '');
}
