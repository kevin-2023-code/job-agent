// A small YAML reader for job-agent's own config files, so the scripts run with no
// npm install (plugins are copied without node_modules). It covers block maps and
// lists, lists of maps, flow maps { a: 1 } and flow lists [a, b], quoted and plain
// scalars, numbers, booleans, null, comments, and > / | block scalars. Anchors,
// tags and multi-document files are not supported.

export function parseYaml(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((raw) => ({ raw, indent: raw.match(/^ */)[0].length, text: stripComment(raw).trimEnd() }));
  const state = { lines, i: 0 };
  skipBlank(state);
  if (state.i >= lines.length) return {};
  return parseBlock(state, lines[state.i].indent);
}

function stripComment(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}

function skipBlank(st) {
  while (st.i < st.lines.length && !st.lines[st.i].text.trim()) st.i++;
}

function parseBlock(st, indent) {
  skipBlank(st);
  const first = st.lines[st.i];
  return first.text.trimStart().startsWith('- ') || first.text.trim() === '-' ? parseList(st, indent) : parseMap(st, indent);
}

function parseMap(st, indent) {
  const out = {};
  while (true) {
    skipBlank(st);
    const line = st.lines[st.i];
    if (!line || line.indent < indent) break;
    if (line.indent > indent) throw new Error(`YAML: unexpected indent at line ${st.i + 1}`);
    const body = line.text.trim();
    const m = /^("[^"]*"|'[^']*'|[^:]+?):(\s+|$)(.*)$/.exec(body);
    if (!m) throw new Error(`YAML: expected "key: value" at line ${st.i + 1}`);
    const key = unquote(m[1].trim());
    st.i++;
    out[key] = valueAfterKey(st, m[3], indent);
  }
  return out;
}

function valueAfterKey(st, rest, indent) {
  rest = rest.trim();
  if (rest === '>' || rest === '|' || rest === '>-' || rest === '|-') return blockScalar(st, indent, rest[0]);
  if (rest !== '') return scalar(rest);
  skipBlank(st);
  const next = st.lines[st.i];
  if (!next || next.indent < indent) return null;
  // A list may sit at the same indent as its key.
  if (next.indent === indent && !next.text.trimStart().startsWith('-')) return null;
  return parseBlock(st, next.indent);
}

function parseList(st, indent) {
  const out = [];
  while (true) {
    skipBlank(st);
    const line = st.lines[st.i];
    if (!line || line.indent < indent) break;
    const body = line.text.trim();
    if (line.indent !== indent || !(body.startsWith('- ') || body === '-')) break;
    const item = body === '-' ? '' : body.slice(2).trim();
    st.i++;
    if (item === '') {
      skipBlank(st);
      out.push(st.lines[st.i] && st.lines[st.i].indent > indent ? parseBlock(st, st.lines[st.i].indent) : null);
    } else if (/^("[^"]*"|'[^']*'|[^:{[]+?):(\s+|$)/.test(item)) {
      // "- key: value" starts a map; its other keys sit two columns in.
      const childIndent = indent + (line.text.length - line.text.trimStart().length - indent) + 2;
      const fake = { raw: ' '.repeat(childIndent) + item, indent: childIndent, text: ' '.repeat(childIndent) + item };
      st.lines.splice(st.i, 0, fake);
      out.push(parseMap(st, childIndent));
    } else {
      out.push(scalar(item));
    }
  }
  return out;
}

function blockScalar(st, indent, style) {
  const parts = [];
  let inner = null;
  while (st.i < st.lines.length) {
    const line = st.lines[st.i];
    if (line.raw.trim() && line.indent <= indent) break;
    if (line.raw.trim()) inner ??= line.indent;
    parts.push(line.raw.trim() ? line.raw.slice(inner) : '');
    st.i++;
  }
  while (parts.length && parts[parts.length - 1] === '') parts.pop();
  return style === '|' ? parts.join('\n') : parts.join('\n').replace(/([^\n])\n(?!\n)/g, '$1 ').replace(/\n\n/g, '\n');
}

function splitFlow(s) {
  const out = [];
  let depth = 0, q = null, cur = '';
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '{' || c === '[') depth++;
    if (c === '}' || c === ']') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function unquote(s) {
  if (s.length >= 2 && s[0] === '"' && s.at(-1) === '"') return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
  if (s.length >= 2 && s[0] === "'" && s.at(-1) === "'") return s.slice(1, -1).replace(/''/g, "'");
  return s;
}

export function scalar(s) {
  s = s.trim();
  if (s.startsWith('{') && s.endsWith('}')) {
    const obj = {};
    for (const part of splitFlow(s.slice(1, -1))) {
      const idx = part.search(/:(\s|$)/);
      if (idx < 0) throw new Error(`YAML: bad flow map entry "${part}"`);
      obj[unquote(part.slice(0, idx).trim())] = scalar(part.slice(idx + 1));
    }
    return obj;
  }
  if (s.startsWith('[') && s.endsWith(']')) return splitFlow(s.slice(1, -1)).map(scalar);
  if (s[0] === '"' || s[0] === "'") return unquote(s);
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}
