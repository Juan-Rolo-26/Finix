export function parseCsv(text: string, delimiter?: string): string[][] {
    if (text.length > 2_000_000) throw new Error('El CSV supera 2 MB. Dividilo en archivos más pequeños.');
    text = text.replace(/^\uFEFF/, '');
    const first = text.split(/\r?\n/)[0];
    const separator = delimiter || [';', ',', '\t'].sort((a,b) => first.split(b).length - first.split(a).length)[0];
    if (![';', ',', '\t'].includes(separator)) throw new Error('Separador inválido');
    const rows: string[][] = [], row: string[] = [];
    let value = '', quoted = false;
    for (let i=0;i<text.length;i++) {
        const char = text[i];
        if (char === '"') {
            if (quoted && text[i+1] === '"') { value += '"'; i++; }
            else quoted = !quoted;
        } else if (!quoted && (char === separator || char === '\n')) {
            row.push(value.replace(/\r$/, '')); value = '';
            if (char === '\n') { if (row.some(Boolean)) rows.push([...row]); row.length = 0; }
        } else value += char;
    }
    if (quoted) throw new Error('Hay comillas sin cerrar en el CSV');
    row.push(value.replace(/\r$/, ''));
    if (row.some(Boolean)) rows.push(row);
    if (rows.length > 2001) throw new Error('Máximo 2000 movimientos por archivo');
    return rows;
}
export function csvDate(value: string, order = 'DMY') {
    const s = value.trim();
    const parts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
    let result = s;
    if (!parts) {
        const local = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s);
        if (!local) throw new Error('Fecha inválida: usá AAAA-MM-DD o DD/MM/AAAA');
        result = local[3] + '-' + (order === 'MDY' ? local[1] : local[2]).padStart(2,'0') + '-' + (order === 'MDY' ? local[2] : local[1]).padStart(2,'0');
    }
    if (!Number.isFinite(Date.parse(result)) || new Date(result).toISOString().slice(0,10) !== result) throw new Error('Fecha inexistente');
    return result;
}
export function csvAmount(value: string, decimal = ',') {
    let s = value.trim().replace(/(?:ARS|USD|EUR|US\$|\$|\s)/gi,'');
    if (/^\(.*\)$/.test(s)) s = '-' + s.slice(1,-1);
    const thousands = decimal === ',' ? '.' : ',';
    if (s.includes(thousands)) {
        const integer = s.split(decimal)[0].replace(/^[+-]/,'');
        if (!new RegExp('^\\d{1,3}(\\' + thousands + '\\d{3})+$').test(integer)) throw new Error('Separadores del importe ambiguos');
        s = s.split(thousands).join('');
    }
    s = s.replace(decimal,'.');
    if (!/^[+-]?\d+(\.\d{1,2})?$/.test(s) || !Number.isFinite(Number(s))) throw new Error('Importe inválido');
    return Number(s);
}
export function toCsv(rows: unknown[][]) {
    return '\uFEFF' + rows.map(row => row.map(cell => {
        let text = String(cell ?? '');
        if (/^[=+@\t\r]/.test(text) || /^-\D/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g,'""') + '"';
    }).join(';')).join('\r\n');
}
