// Builds docs/informe_defensa_en_profundidad.pdf from docs/gameday/informe-gameday.md.
// Markdown -> HTML (small converter for the subset the report uses) -> headless Chrome, Letter size,
// same cover layout as the DevOps report. Usage: node make-informe-pdf.mjs [--html-only]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const SRC = join(root, 'docs', 'gameday', 'informe-gameday.md');
const OUT = join(root, 'docs', 'informe_defensa_en_profundidad.pdf');
const FIG = pathToFileURL(join(root, 'docs', 'diagramas', 'arquitectura-seguridad-gameday.png')).href;
const TMP = process.env.GD_TMP || join(root, 'security-chaos', 'ai-assistant', 'out');
mkdirSync(TMP, { recursive: true });
const HTML = join(TMP, 'informe_defensa_en_profundidad.html');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  const codes = [];
  s = esc(s).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2">$2</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  // Keep a number and its unit together so "2075 s" never splits across lines.
  s = s.replace(/(\d) (s|min|m|h)(?![\wáéíóú])/g, '$1 $2');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}
function tableHtml(rows) {
  const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  return `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${
    body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function convert(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i += 1; continue; }
    if (l.startsWith('## ')) { out.push(`<h2>${inline(l.slice(3))}</h2>`); i += 1; continue; }
    if (l.startsWith('> ')) {
      const q = [];
      while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      out.push(`<blockquote>${inline(q.join(' '))}</blockquote>`); continue;
    }
    if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i += 1; }
      out.push(tableHtml(rows));
      if (rows[0].includes('| Capa | Control |')) out.push(`<figure><img src="${FIG}"><figcaption>Arquitectura de seguridad del game day: tres nubes, cinco capas, puntos de inyección (E1–E4), fronteras de confianza y recolección de telemetría (T1–T4). Versión a tamaño completo en docs/diagramas/arquitectura-seguridad-gameday.png.</figcaption></figure>`);
      continue;
    }
    const li = /^(\s*)(- |\d+\. )/.exec(l);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < lines.length && /^(\s*)(- |\d+\. )/.test(lines[i])) {
        let item = lines[i].replace(/^\s*(- |\d+\. )/, '');
        i += 1;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^(\s*)(- |\d+\. )/.test(lines[i])) { item += ` ${lines[i].trim()}`; i += 1; }
        items.push(item);
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    const p = [];
    while (i < lines.length && lines[i].trim() && !/^(## |> |\||\s*- |\s*\d+\. )/.test(lines[i])) { p.push(lines[i].trim()); i += 1; }
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return out.join('\n');
}

// Drop the H1, the course line and the group line: the cover carries them.
const md = readFileSync(SRC, 'utf8').split(/\r?\n/).slice(4).join('\n');
const css = `
@page { size: Letter; margin: 0.65in 0.7in; }
* { box-sizing: border-box; }
body { font-family: Calibri, 'Segoe UI', sans-serif; font-size: 10.3pt; line-height: 1.32; color: #202124; margin: 0; }
.cover { border-bottom: 2.5px solid #1A73E8; padding-bottom: 12px; margin-bottom: 14px; }
.cover .tag { font-size: 9.5pt; letter-spacing: .32em; font-weight: bold; color: #1A73E8; }
.cover h1 { font-family: Cambria, Georgia, serif; font-size: 25pt; margin: 4px 0 2px; color: #202124; }
.cover h2 { font-family: Cambria, Georgia, serif; font-size: 14pt; margin: 0 0 8px; font-weight: normal; color: #3C4043; border: 0; padding: 0; }
.cover .names { font-size: 12pt; font-weight: bold; margin-bottom: 6px; }
.cover table { border: 0; width: auto; margin: 0; font-size: 10.3pt; }
.cover td { border: 0; padding: 1px 14px 1px 0; vertical-align: top; }
.cover td:first-child { font-weight: bold; color: #5F6368; }
h2 { font-family: Cambria, Georgia, serif; font-size: 13.5pt; color: #1A73E8; margin: 15px 0 5px; border-bottom: 1px solid #DADCE0; padding-bottom: 2px; break-after: avoid; }
p { margin: 4px 0 6px; text-align: justify; }
ul, ol { margin: 3px 0 6px; padding-left: 20px; } li { margin: 1px 0; }
code { font-family: Consolas, 'Courier New', monospace; font-size: 8.6pt; background: #F1F3F4; padding: 0 2px; border-radius: 3px; word-break: break-word; }
table { border-collapse: collapse; width: 100%; margin: 5px 0 8px; font-size: 8.6pt; }
th { background: #F1F3F4; text-align: left; font-weight: bold; }
th, td { border: 1px solid #DADCE0; padding: 2.5px 4px; vertical-align: top; }
tr { break-inside: avoid; }
blockquote { margin: 6px 0; padding: 4px 10px; border-left: 3px solid #1A73E8; background: #F8F9FA; font-size: 9.8pt; }
figure { margin: 8px 0; text-align: center; break-inside: avoid; } figure img { width: 100%; border: 1px solid #DADCE0; }
figcaption { font-size: 8.6pt; color: #5F6368; margin-top: 3px; }
a { color: #1A73E8; text-decoration: none; word-break: break-all; }
`;
const cover = `<div class="cover">
<div class="tag">ENTREGA FINAL</div>
<h1>Informe del game day</h1>
<h2>Ingeniería del Caos de Seguridad en un flujo de tres nubes</h2>
<div class="names">Phol Castañeda, Neithan Gómez y Daniela Higuita</div>
<table>
<tr><td>Materia</td><td>ÉNFASIS I: DEFENSA EN PROFUNDIDAD</td></tr>
<tr><td>Profesor</td><td>José Fabio Jaramillo</td></tr>
<tr><td>Fecha</td><td>18 de noviembre de 2026 · game day del 17 de noviembre · github.com/PholCast/biblio-express</td></tr>
</table></div>`;
writeFileSync(HTML, `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe de defensa en profundidad</title><style>${css}</style></head><body>${cover}\n${convert(md)}</body></html>`, 'utf8');
console.log(`HTML: ${HTML}`);
if (process.argv.includes('--html-only')) process.exit(0);

const chrome = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${OUT}`, pathToFileURL(HTML).href], { encoding: 'utf8' });
const bytes = readFileSync(OUT);
const pages = (bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`PDF: ${OUT} (${bytes.length} bytes, ${pages} páginas)`);
if (r.status !== 0) console.error(r.stderr);
