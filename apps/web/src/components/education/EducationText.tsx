import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { type ReactNode } from 'react';

/** Small, safe Markdown subset used by the reference library; never injects HTML. */
export function renderEducationText(text: string): ReactNode {
  const pattern = /\[([^\]]+)\]\((https?:\/\/(?:[^\s()]|\([^\s()]*\))+|\/(?!\/)(?:[^\s()]|\([^\s()]*\))+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
  const result: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    if (index > cursor) result.push(text.slice(cursor, index));
    if (match[1]) {
      const external = match[2].startsWith('http');
      result.push(<a key={index} href={match[2]} target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="text-primary font-semibold underline underline-offset-2 break-words hover:text-primary/80">{renderEducationText(match[1])}</a>);
    } else if (match[3]) {
      result.push(<strong key={index} className="font-bold text-foreground">{match[3]}</strong>);
    } else if (match[4]) {
      result.push(<code key={index} className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{match[4]}</code>);
    } else {
      result.push(<em key={index}>{renderEducationText(match[5])}</em>);
    }
    cursor = index + match[0].length;
  }
  if (cursor < text.length) result.push(text.slice(cursor));
  return result;
}

export function EducationTextBlock({text}: {text: string}) {
  const code = text.trim().match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  if (code) return <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/50 p-4 font-mono text-xs sm:text-sm leading-relaxed">{code[1]}</pre>;
  const lines = text.trim().split('\n');
  if (lines.every(line => /^\s*[-*]\s+/.test(line))) {
    return <ul className="list-disc space-y-2 pl-5">{lines.map((line, index) => <li key={index}>{renderEducationText(line.replace(/^\s*[-*]\s+/, ''))}</li>)}</ul>;
  }
  if (lines.every(line => /^\s*\d+\.\s+/.test(line))) {
    return <ol className="list-decimal space-y-2 pl-5">{lines.map((line, index) => <li key={index}>{renderEducationText(line.replace(/^\s*\d+\.\s+/, ''))}</li>)}</ol>;
  }
  return <p className="leading-relaxed whitespace-pre-line">{renderEducationText(text)}</p>;
}

export function EducationTable({text}: {text: string}) {
    const { ui: finixUi } = useFinixUiTranslation();

  const rows = text.trim().split('\n').map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
  const header = rows[0];
  const body = rows.slice(1).filter(row => !row.every(cell => /^:?-{3,}:?$/.test(cell)));
  return <div className="overflow-x-auto my-4 rounded-xl border border-border" tabIndex={0} role="region" aria-label={finixUi("Tabla de referencia; desplazamiento horizontal")}>
    <table className="w-full min-w-[420px] border-collapse text-left text-xs sm:text-sm">
      <thead className="bg-muted/60"><tr>{header.map((cell, index) => <th key={index} scope="col" className="border-b border-border px-3 py-2.5 font-bold">{renderEducationText(cell)}</th>)}</tr></thead>
      <tbody>{body.map((row, index) => <tr key={index} className="border-b border-border/50 last:border-0">{header.map((_, column) => <td key={column} className="px-3 py-2.5 align-top">{renderEducationText(row[column] || '')}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

