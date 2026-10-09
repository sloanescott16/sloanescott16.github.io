/* Page check for Live v9, the day grid.  bun _tests/live-daygrid/test-page.js
   Serves this worktree on localhost. Every ESPN and MLB feed is answered from samples saved with grab.sh (real feeds);
   team logos and fonts load from the real CDN so the screenshots look right. Screenshots go to preview/.
   Cases: today (9 Oct, real clock), and a busy Saturday (10 Oct, clock held at 3:30 PM Central, game states set by
   the clock), which also carries a made-up 11:15 PM Central game on the 11 Oct board to prove late games show. */
const { chromium } = require('../golf-live/pw-shim.js');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), SMP = path.join(__dirname, 'samples');
const OUT = path.join(ROOT, 'preview'); fs.mkdirSync(OUT, { recursive: true });
const srv = Bun.serve({ port: 0, fetch(req) { let p = decodeURIComponent(new URL(req.url).pathname); if (p.endsWith('/')) p += 'index.html';
  if (/\/sw\.js$/.test(p)) return new Response('nf', { status: 404 }); const f = path.join(ROOT, p);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? new Response(Bun.file(f)) : new Response('nf', { status: 404 }); } });
let pass = 0, fail = 0; function ok(c, m) { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } }
const KEY = { 'football/nfl':'nfl', 'football/college-football':'cfb', 'baseball/mlb':'mlb', 'hockey/nhl':'nhl', 'basketball/nba':'nba', 'soccer/eng.1':'epl',
  'soccer/esp.1':'liga', 'soccer/uefa.champions':'ucl', 'soccer/usa.1':'mls', 'soccer/fifa.world':'wc', 'soccer/fifa.friendly':'fri',
  'soccer/concacaf.nations.league':'cnl', 'soccer/uefa.nations':'unl' };
const RUN = { nfl:195, cfb:210, mlb:180, nhl:150, nba:150 };
function feed(d, k, clock) {
  const f = path.join(SMP, d, k + '.json'); if (!fs.existsSync(f)) return { events: [] };
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (clock) for (const e of j.events || []) {   // the busy day: set each game's state by the held clock
    const c = e.competitions[0], st = +new Date(e.date), run = (RUN[k] || 115) * 60e3, t = c.status.type;
    if (/postponed|canceled/i.test(t.name)) continue;
    let n = 0; for (const x of c.competitors) x.score = String(clock < st ? '' : (n++ * 3 + (e.id % 7) + Math.floor((clock - st) / 1.2e6)) % (k === 'soc' || KEY_SOC[k] ? 4 : 40));
    if (clock < st) Object.assign(t, { state: 'pre', completed: false });
    else if (clock < st + run) Object.assign(t, { state: 'in', completed: false, shortDetail: k === 'mlb' ? 'Top 5th' : KEY_SOC[k] ? "67'" : k === 'nhl' ? '2nd 8:14' : 'Q3 6:12' });
    else Object.assign(t, { state: 'post', completed: true, shortDetail: 'Final' });
  }
  return j;
}
const KEY_SOC = { epl:1, liga:1, ucl:1, mls:1, wc:1, fri:1, cnl:1, unl:1 };
function lateGame() {   // an 11:15 PM Central kickoff on Saturday sits on Sunday's ESPN board
  const j = JSON.parse(fs.readFileSync(path.join(SMP, '20261010', 'nba.json'), 'utf8')); const e = JSON.parse(JSON.stringify(j.events[0]));
  e.id = '999000111'; e.date = '2026-10-11T04:15Z'; Object.assign(e.competitions[0].status.type, { state: 'pre', completed: false, shortDetail: '11:15 PM' });
  return e;
}
const CASES = [
  { tag: 'today', days: ['20261009', '20261010'], clock: 0 },
  { tag: 'busy-saturday', days: ['20261010', '20261011'], clock: +new Date('2026-10-10T20:30:00Z'), late: true },
];
async function open(b, w, mob, cs, errs) {
  const ctx = await b.newContext({ viewport: { width: w, height: mob ? 844 : 900 }, isMobile: mob, hasTouch: mob }); const p = await ctx.newPage();
  const tag = cs.tag + ' @' + w; p.on('pageerror', e => errs.push(tag + ': ' + e.message));
  if (cs.clock) await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const off = ${cs.clock} - Date.now(), D = Date;
    class F extends D { constructor(...a) { a.length ? super(...a) : super(D.now() + off); } static now() { return D.now() + off; } } window.Date = F; })();` });
  await p.route('**', r => { const u = r.request().url(); return u.startsWith('http://localhost:') && !/\/sw\.js$/.test(u) ? r.continue() : r.abort(); });
  await p.route(/^https:\/\/(a\.espncdn\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, r => r.continue());
  p.hits = [];
  await p.route(/^https:\/\/site\.api\.espn\.com\/apis\/site\/v2\/sports\//, r => {
    const u = new URL(r.request().url()), m = /sports\/(.+)\/scoreboard/.exec(u.pathname), k = m && KEY[m[1]], d = u.searchParams.get('dates');
    p.hits.push(k + ':' + d);
    if (!k || !cs.days.includes(d)) return r.fulfill({ json: { events: [] } });
    const j = feed(d, k, cs.clock);
    if (cs.late && k === 'nba' && d === '20261011') j.events = (j.events || []).concat([lateGame()]);
    return r.fulfill({ json: j });
  });
  await p.route(/^https:\/\/site\.api\.espn\.com\/apis\/site\/v2\/sports\/soccer\/all\/teams\//, r => r.fulfill({ json: { team: {} } }));
  await p.route(/^https:\/\/statsapi\.mlb\.com\//, r => r.fulfill({ body: fs.readFileSync(path.join(SMP, cs.days[0], 'statsapi.json'), 'utf8'), contentType: 'application/json' }));
  return { ctx, p, tag };
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const cs of CASES) for (const [w, mob] of [[1440, false], [390, true]]) {
    const { ctx, p, tag } = await open(b, w, mob, cs, errs);
    await p.goto('http://localhost:' + srv.port + '/live/');
    await p.waitForFunction(() => document.getElementById('meta').textContent.startsWith('Updated'), undefined, { timeout: 20000 });
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const dg = document.getElementById('dg'), now = dg.querySelector('.now'), labs = [...dg.querySelectorAll('.sp .lab img')];
      const nr = now && now.getBoundingClientRect(), gr = dg.getBoundingClientRect();
      return { rows: labs.map(i => i.alt), imgs: labs.every(i => i.complete && i.naturalWidth > 0), blocks: dg.querySelectorAll('.b').length, live: dg.querySelectorAll('.b.in').length,
        nowSeen: !!nr && nr.left >= gr.left && nr.left <= gr.right, scrolls: dg.scrollWidth > dg.clientWidth + 2, scrollLeft: dg.scrollLeft,
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1, tabs: document.querySelectorAll('h2,.li').length,
        late: !!dg.querySelector('.b[data-g="nba:999000111"]'), labW: dg.querySelector('.sp .lab') ? dg.querySelector('.sp .lab').offsetWidth : 0, sum: document.getElementById('sum').textContent,
        overlap: (() => { const bs = [...dg.querySelectorAll('.b')].map(x => x.getBoundingClientRect()); for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], c = bs[j];
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) return true; } return false; })() }; });
    console.log('   ' + tag + ': rows ' + r.rows.join(', ') + ' | blocks ' + r.blocks + ' | live ' + r.live + ' | ' + r.sum + ' | scrollLeft ' + r.scrollLeft);
    ok(r.rows.length > 0 && r.imgs, tag + ': one row per sport with its picture loaded');
    ok(r.tabs === 0, tag + ': the old league sections and chip list rows are gone');
    ok(r.nowSeen, tag + ': the now line is in view on open');
    ok(!r.overlap, tag + ': no two game blocks overlap');
    ok(!r.pageOverflow, tag + ': the page itself does not scroll sideways');
    if (mob) ok(r.scrolls, tag + ': the hours scroll sideways on a phone');
    ok(r.labW === (mob ? 58 : 76), tag + ': first drawing uses the ' + (mob ? 'phone' : 'desk') + ' layout (label ' + r.labW + ' px)');
    if (cs.late) ok(r.late, tag + ': an 11:15 PM Central game from the next day\'s board shows tonight');
    if (cs.clock) ok(r.live > 0, tag + ': live games marked (' + r.live + ')');
    await p.screenshot({ path: path.join(OUT, 'live-v9-' + cs.tag + '-' + w + '.png') });
    if (mob) {   // the pinned pictures stay put when the hours scroll
      const s = await p.evaluate(() => { const dg = document.getElementById('dg'), l = dg.querySelector('.sp .lab'), x0 = l.getBoundingClientRect().left; dg.scrollLeft += 300; return new Promise(res => setTimeout(() => res([x0, l.getBoundingClientRect().left]), 100)); });
      ok(Math.abs(s[0] - s[1]) < 1, tag + ': sport pictures stay pinned while the hours scroll (' + s.map(Math.round).join(' -> ') + ')');
    }
    const pick = cs.clock ? '.b.in' : '.b';
    if (await p.evaluate(s => !!document.querySelector(s), pick)) {
      await p.click(pick); await p.waitForTimeout(400);
      const sh = await p.evaluate(() => { const s = document.getElementById('gs'), g = s.querySelector('.g'); return { on: s.classList.contains('on'), card: !!g, href: g && g.getAttribute('href'), who: s.querySelectorAll('[data-pbp]').length }; });
      ok(sh.on && sh.card && /^https:\/\//.test(sh.href || ''), tag + ': tapping a game opens its card (links to ' + sh.href + ', ' + sh.who + ' player names)');
      await p.screenshot({ path: path.join(OUT, 'live-v9-' + cs.tag + '-' + w + '-sheet.png') });
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok(await p.evaluate(() => !document.getElementById('gs').classList.contains('on')), tag + ': Escape closes the card');
    }
    await ctx.close();
  }
  await b.close(); srv.stop(true);
  ok(!errs.length, 'no page errors' + (errs.length ? ':\n' + errs.join('\n') : ''));
  console.log('\n' + (fail ? 'FAILED' : 'PASSED') + ' ' + pass + '/' + (pass + fail)); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
