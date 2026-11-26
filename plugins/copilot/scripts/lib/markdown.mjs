// A small Markdown → HTML renderer, enough for a CV or cover letter:
// headings, paragraphs, bullet lists, bold, italic, links, inline code, hr, HTML comments dropped.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u.replace(/"/g, '%22')}">${t}</a>`);
}

export function renderMarkdown(md) {
  const src = md.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n/g, '\n');
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = null; } };

  for (const raw of src.split('\n')) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      flushPara(); flushList();
      const n = m[1].length;
      out.push(`<h${n}>${inline(m[2])}</h${n}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushPara(); flushList(); out.push('<hr>');
    } else if ((m = /^\s*[-*+]\s+(.*)$/.exec(line))) {
      flushPara(); (list ??= []).push(m[1]);
    } else if (list && /^\s{2,}\S/.test(line)) {
      list[list.length - 1] += ' ' + line.trim();
    } else {
      flushList(); para.push(line.trim());
    }
  }
  flushPara(); flushList();
  return out.join('\n');
}
