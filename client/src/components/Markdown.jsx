export default function Markdown({ text }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  const elements = [];
  let inCode = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(
          <pre key={'code-' + i} className="code-block">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i}>{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i}>{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i}>{line.slice(2)}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i}>{line.slice(2)}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<li key={i}>{line.replace(/^\d+\.\s/, '')}</li>);
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i}>{line}</p>);
    }
  }

  return <div className="markdown-body">{elements}</div>;
}
