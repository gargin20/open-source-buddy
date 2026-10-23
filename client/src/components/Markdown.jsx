// TODO: render the text as Markdown (headings, bold, lists, code) instead of
// plain text. A small library such as react-markdown works, or write a tiny
// renderer yourself. Do not use dangerouslySetInnerHTML with unsanitised text.
export default function Markdown({ text }) {
  return <pre className="plain">{text}</pre>;
}
