/* Live split: one-off probe, prints what sticks out past the Schedule board's right edge at 375x667 (busy Saturday). */
process.env.PAGES = 'schedule';
const { chromium } = require('../golf-live/pw-shim.js');
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..', '..');
const srv = Bun.serve({ port: 0, fetch(req) { let p = decodeURIComponent(new URL(req.url).pathname); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  return fs.existsSync(f) && fs.statSync(f).isFile() && !/sw\.js$/.test(p) ? new Response(Bun.file(f)) : new Response('nf', { status: 404 }); } });
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }), p = await ctx.newPage();
  await p.route('**', r => { const u = r.request().url(); if (u.startsWith('http://localhost:')) return r.continue();
    const m = /sports\/(.+)\/scoreboard/.exec(u), d = new URL(u).searchParams.get('dates'); if (!m) return r.abort();
    const f = path.join(ROOT, '_tests/live-daygrid/samples', d || '20261009', ({ 'football/college-football':'cfb','baseball/mlb':'mlb','hockey/nhl':'nhl','basketball/nba':'nba','football/nfl':'nfl' })[m[1]] + '.json');
    return r.fulfill({ json: fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { events: [] } }); });
  await p.goto('http://localhost:' + srv.port + '/schedule/'); await p.waitForTimeout(2500);
  console.log(JSON.stringify(await p.evaluate(() => { const dg = document.getElementById('dg'), R = dg.getBoundingClientRect().left + dg.clientLeft + dg.clientWidth;
    return { cw: dg.clientWidth, sw: dg.scrollWidth, dgi: document.getElementById('dgi').style.width, hd: dg.querySelector('.hd') && dg.querySelector('.hd').scrollWidth, ov2: [...dg.querySelectorAll(".bd > *, .gut > *")].filter(e => e.scrollWidth > e.clientWidth + 0.5 || e.getBoundingClientRect().right > dg.getBoundingClientRect().left + dg.clientWidth).slice(0, 8).map(e => e.className + " " + e.scrollWidth + "/" + e.clientWidth + " " + e.textContent.slice(0, 12)), over: [...dg.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > R + 0.5).slice(0, 8).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right - R)) }; })));
  await b.close(); srv.stop(true); process.exit(0); })();
