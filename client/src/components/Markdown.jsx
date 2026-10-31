import ReactMarkdown from 'react-markdown';

export default function Markdown({ text }) {
  if (!text) return null;

  return (
    <div className="markdown-content">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
