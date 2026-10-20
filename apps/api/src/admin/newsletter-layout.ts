const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export function newsletterLayout(tag: string, title: string, subtitle: string, body: string) {
    const appUrl = escapeHtml((process.env.FRONTEND_URL || 'https://finixarg.com').replace(/\/$/, ''));
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body,table,td,th,p,a{font-family:Arial,Helvetica,sans-serif}@media only screen and (max-width:640px){.newsletter-outer{padding:12px 6px!important}.newsletter-content,.newsletter-header{padding:20px 16px!important}.newsletter-title{font-size:25px!important}.quote-column{display:block!important;width:100%!important;padding:6px 0!important}.fx-tile{display:inline-block!important;width:50%!important;box-sizing:border-box!important}.newsletter-panel{padding:16px!important}}</style>
</head><body style="margin:0;padding:0;background:#f2f7f4;font-family:Arial,Helvetica,sans-serif;color:#17332a;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f2f7f4;table-layout:fixed"><tr><td class="newsletter-outer" align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:880px;background:#ffffff;border:1px solid #dfeae3;border-radius:18px;table-layout:fixed">
<tr><td class="newsletter-header" style="background:#087747;padding:30px 32px;color:#ffffff;border-radius:18px 18px 0 0;overflow-wrap:break-word">
<div style="font-size:12px;letter-spacing:1.8px;font-weight:bold;line-height:1.6;color:#d3f5e2">FINIX <span style="color:#54e0a5">●</span> ${escapeHtml(tag)}</div>
<h1 class="newsletter-title" style="font-size:30px;line-height:1.3;margin:16px 0 10px;color:#ffffff">${escapeHtml(title)}</h1>
<p style="margin:0;color:#e1f4e9;font-size:14px;line-height:1.7">${escapeHtml(subtitle)}</p></td></tr>
<tr><td class="newsletter-content" style="padding:28px 32px 32px;line-height:1.7;overflow-wrap:break-word;word-wrap:break-word">${body}
<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e5eee8;color:#74867c;font-size:11px;line-height:1.7">Finix · Información de mercado para acompañar tu análisis. No constituye una recomendación personalizada.<br>
<a style="color:#087747" href="${appUrl}/settings">Preferencias de correo</a> · <a style="color:#087747" href="{{unsubscribe_url}}">Cancelar suscripción</a></div>
</td></tr></table></td></tr></table></body></html>`;
}

export function newsletterPanel(label: string, body: string) {
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 18px;table-layout:fixed"><tr><td class="newsletter-panel" style="padding:22px 24px;border:1px solid #e0ece5;border-radius:14px;background:#ffffff;overflow-wrap:break-word;word-wrap:break-word"><div style="font-size:12px;line-height:1.6;letter-spacing:1.2px;text-transform:uppercase;color:#087747;font-weight:bold;margin-bottom:14px">${escapeHtml(label)}</div>${body}</td></tr></table>`;
}

export function newsletterCompanyHeading(company: { ticker: string; companyName: string; logoUrl?: string | null }) {
    const ticker = company.ticker.replace(/^[A-Z]+:/i, '').toUpperCase();
    let logo = '';
    try {
        const url = new URL(company.logoUrl || '');
        // Gmail does not reliably render SVG. Retain supported source images;
        // use the same company's PNG when the calendar supplies an SVG logo.
        if (url.protocol === 'https:' && /\.(png|jpe?g|gif|webp)$/i.test(url.pathname)) logo = url.href;
    } catch { /* Use the ticker-specific PNG below. */ }
    if (!logo && /^[A-Z0-9.-]{1,20}$/.test(ticker)) logo = `https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`;
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0 0 14px;table-layout:fixed"><tr>${logo ? `<td width="62" style="width:62px;vertical-align:middle;padding:0 14px 0 0"><img src="${escapeHtml(logo)}" alt="${escapeHtml(ticker)}" width="48" height="48" style="display:block;width:48px;height:48px;max-width:48px;object-fit:contain;border:1px solid #e0ece5;border-radius:12px;background:#ffffff"></td>` : ''}<td style="vertical-align:middle"><h2 style="margin:0;font-size:20px;line-height:1.4;color:#17332a;overflow-wrap:break-word">${escapeHtml(company.companyName)} <span style="font-size:14px;color:#60766b">(${escapeHtml(ticker)})</span></h2></td></tr></table>`;
}
