// Renders **bold** / *italic* markdown as SAFE React nodes (text is escaped by
// React — no HTML injection). Used for AI-generated content.
export default function FormattedText({ text = "", className = "" }) {
  const nodes = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={key++}>{m[1]}</strong>);
    else nodes.push(<em key={key++}>{m[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <div className={`whitespace-pre-wrap ${className}`}>{nodes}</div>;
}
