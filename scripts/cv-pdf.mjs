#!/usr/bin/env node
// Render a Markdown CV or cover letter to HTML and PDF.
//   node scripts/cv-pdf.mjs <file.md> [--out file.pdf] [--letter] [--html-only]
// PDF uses Playwright if installed, else a local Chrome / Edge / Chromium in headless mode.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { p, parseArgs } from './lib/paths.mjs';
import { renderMarkdown } from './lib/markdown.mjs';

const args = parseArgs(process.argv.slice(2));
const input = args._[0];
if (!input || !existsSync(input)) {
  console.error('Usage: node scripts/cv-pdf.mjs <file.md> [--out file.pdf] [--letter] [--html-only]');
  process.exit(1);
}

const md = readFileSync(input, 'utf8');
const title = (/^#\s+(.+)$/m.exec(md)?.[1] ?? basename(input, '.md')).trim();
const template = readFileSync(p('templates', 'cv.html'), 'utf8');
const html = template
  .replace('{{title}}', title.replace(/</g, '&lt;'))
  .replace('{{page_size}}', args.letter ? 'Letter' : 'A4')
  .replace('{{body}}', renderMarkdown(md));

const htmlPath = resolve(input.replace(/\.md$/i, '') + '.html');
writeFileSync(htmlPath, html);
console.log(`HTML: ${htmlPath}`);
if (args['html-only']) process.exit(0);

const pdfPath = resolve(typeof args.out === 'string' ? args.out : input.replace(/\.md$/i, '') + '.pdf');

async function withPlaywright() {
  let pw;
  try { pw = await import('playwright'); } catch { return false; }
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  return true;
}

function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const pf = process.env['ProgramFiles'] ?? 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
  const local = process.env.LOCALAPPDATA ?? '';
  const candidates = {
    win32: [
      `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pf86}\\Google\\Chrome\\Application\\chrome.exe`,
      `${local}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pf86}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge'],
  }[process.platform] ?? [];
  return candidates.find((c) => c && existsSync(c));
}

function withChrome() {
  const bin = findBrowser();
  if (!bin) return false;
  const r = spawnSync(bin, [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--no-first-run',
    `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href,
  ], { stdio: 'pipe', timeout: 60_000 });
  return r.status === 0 && existsSync(pdfPath);
}

const ok = (await withPlaywright()) || withChrome();
if (!ok) {
  console.error('No PDF backend found. Install Chrome or Edge, set CHROME_PATH, or `npm i -D playwright && npx playwright install chromium`.');
  console.error(`You can also open ${htmlPath} in a browser and print to PDF.`);
  process.exit(1);
}

const pages = (readFileSync(pdfPath, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`PDF:  ${pdfPath}  (${pages || '?'} page${pages === 1 ? '' : 's'}, ${Math.round(statSync(pdfPath).size / 1024)} KB)`);
