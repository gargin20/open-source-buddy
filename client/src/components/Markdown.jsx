// Safe Markdown renderer – no external dependency, no dangerouslySetInnerHTML.
// Supports: headings (h1-h6), bold, italic, inline-code, fenced code blocks,
// unordered lists, ordered lists, and http/https links.

function parseInline(text, keyPrefix) {
  const parts = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let last = 0;
  let match;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    const k = `${keyPrefix}-${match.index}`;
    if (raw.startsWith('`')) {
      parts.push(<code key={k}>{raw.slice(1, -1)}</code>);
    } else if (raw.startsWith('**')) {
      parts.push(<strong key={k}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*')) {
      parts.push(<em key={k}>{raw.slice(1, -1)}</em>);
    } else {
      // Link – only http/https allowed (enforced by regex above)
      parts.push(
        <a key={k} href={match[3]} target="_blank" rel="noreferrer noopener">
          {match[2]}
        </a>,
      );
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ text }) {
  // Guard: empty or non-string input must never crash
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');
  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block  ```lang
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={`cb-${i}`} className={lang ? `language-${lang}` : undefined}>
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      i++; // skip closing ```
      continue;
    }

    // Headings  # ## ### …
    const hMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      const Tag = `h${hMatch[1].length}`;
      nodes.push(<Tag key={`h-${i}`}>{parseInline(hMatch[2], `h-${i}`)}</Tag>);
      i++;
      continue;
    }

    // Unordered list  - / * / +
    if (/^[-*+]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(<li key={i}>{parseInline(lines[i].slice(2), `ul-${i}`)}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`}>{items}</ul>);
      continue;
    }

    // Ordered list  1. 2. …
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i}>{parseInline(lines[i].replace(/^\d+\.\s/, ''), `ol-${i}`)}</li>,
        );
        i++;
      }
      nodes.push(<ol key={`ol-${i}`}>{items}</ol>);
      continue;
    }

    // Blank line – skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    nodes.push(<p key={`p-${i}`}>{parseInline(line, `p-${i}`)}</p>);
    i++;
  }

  return <div className="markdown">{nodes}</div>;
}
