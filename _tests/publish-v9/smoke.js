/* publish-v9 smoke check: Landing, Players and The Pitch load with no page errors at 1440 and 390.
   bun _tests/publish-v9/smoke.js   Serves this worktree on localhost; feeds come from the real network. Screenshots go to preview/publish-*.png. */
const { chromium } = require('../golf-live/pw-shim.js');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), OUT = path.join(ROOT, 'preview');
const srv = Bun.serve({ port: 0, fetch(req) { let p = decodeURIComponent(new URL(req.url).pathname); if (p.endsWith('/')) p += 'index.html';
  if (/\/sw\.js$/.test(p)) return new Response('nf', { status: 404 }); const f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return new Response(Bun.file(f)); if (p !== '/favicon.ico') MISS.push(p); return new Response('nf', { status: 404 }); } });
const MISS = [];
let pass = 0, fail = 0; function ok(c, m) { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } }
const PAGES = [['landing', '/'], ['players', '/player/'], ['the-pitch', '/the-pitch/']];
(async () => {
  const b = await chromium.launch();
  for (const [name, url] of PAGES) for (const [w, mob] of [[1440, false], [390, true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: mob ? 844 : 900 }, isMobile: mob, hasTouch: mob }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    MISS.length = 0; await p.route('**', r => r.continue());   // the shim refuses anything unrouted; these pages read their real feeds
    await p.goto('http://localhost:' + srv.port + url); await p.waitForTimeout(4000);
    const r = await p.evaluate(() => ({ title: document.title, text: document.body.innerText.trim().length, broken: /can.t be reached|ERR_/.test(document.body.innerText), over: document.documentElement.scrollWidth > innerWidth + 1 }));
    ok(r.text > 20 && !r.broken,name + ' @' + w + ': loads (' + r.title + ', ' + r.text + ' chars)');
    ok(!errs.length, name + ' @' + w + ': no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
    ok(!MISS.length, name + ' @' + w + ': no missing local files' + (MISS.length ? ': ' + MISS.join(' | ') : ''));
    ok(!r.over, name + ' @' + w + ': no sideways page scroll');
    await p.screenshot({ path: path.join(OUT, 'publish-' + name + '-' + w + '.png') });
    await ctx.close();
  }
  await b.close(); srv.stop(true);
  console.log('\n' + (fail ? 'FAILED' : 'PASSED') + ' ' + pass + '/' + (pass + fail)); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
