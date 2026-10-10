/* Live split: one-off probe, lists text under 11 px in the game sheet opened from the phone list at 375x667. */
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
  await p.goto('http://localhost:' + srv.port + '/schedule/'); await p.waitForTimeout(2500); await p.click('.pr'); await p.waitForTimeout(500);
  console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('#gs *')].filter(e => e.getBoundingClientRect().width > 0 && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.className + ' ' + getComputedStyle(e).fontSize + ' ' + e.textContent.trim().slice(0, 15)))));
  await b.close(); srv.stop(true); process.exit(0); })();
