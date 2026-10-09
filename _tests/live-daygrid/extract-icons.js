/* One-off: copy the landing tiles' picture icons (Pope, hockey, basketball, soccer jumper) out of the landing
   page into live/img so the Live day grid can use them as row labels. bun _tests/live-daygrid/extract-icons.js
   v11: golf too; its picture is the golf tile's round cup, a CSS background (.cup{... url("data:image/webp...")}). */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const tiles = { mlb: 'id="tBb"', nhl: 'id="tHk"', nba: 'id="tBk"', soc: 'id="tSoc"' };
for (const [k, mark] of Object.entries(tiles)) {
  const at = html.indexOf(mark); const m = /src="data:image\/webp;base64,([^"]+)"/.exec(html.slice(at));
  const buf = Buffer.from(m[1], 'base64'); fs.writeFileSync(path.join(ROOT, 'live', 'img', k + '.webp'), buf);
  console.log(k, buf.length);
}
{ const m = /\.cup\{[^}]*url\("data:image\/webp;base64,([^"]+)"\)/.exec(html);
  const buf = Buffer.from(m[1], 'base64'); fs.writeFileSync(path.join(ROOT, 'live', 'img', 'golf.webp'), buf); console.log('golf', buf.length); }
