/* Live split (job 1010-1240-nml): width and height check for /schedule/ and /live/ at 375x667, 390x844 and 1440x900.
   bun _tests/live-split/measure.js <label>     (set CHROME to Edge and PW_PROFILE to the worktree's .browser-profile)
   Feeds come from the saved samples in _tests/live-daygrid (same answers as test-page.js). Prints one line per page and
   size, writes _tests/live-split/measure-<label>.json and screenshots preview/split-<label>-<page>-<case>-<w>.png.
   It also checks the split: the landing page's Live and Schedule pills, Live is the classic scoreboard (live cards by league,
   then Later today and Finals today), Schedule is the day grid, and at phone width neither page nor board scrolls sideways.
   Exit code 1 if any check fails. */
const { chromium } = require('../golf-live/pw-shim.js');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), SMP = path.join(ROOT, '_tests', 'live-daygrid', 'samples'), OUT = path.join(ROOT, 'preview');
const LABEL = process.argv[2] || 'run';
let pass = 0, fail = 0; function ok(c, m) { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } }
const srv = Bun.serve({ port: 0, fetch(req) { let p = decodeURIComponent(new URL(req.url).pathname); if (p.endsWith('/')) p += 'index.html';
  if (/\/sw\.js$/.test(p)) return new Response('nf', { status: 404 }); const f = path.join(ROOT, p);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? new Response(Bun.file(f)) : new Response('nf', { status: 404 }); } });
const KEY = { 'football/nfl':'nfl', 'football/college-football':'cfb', 'baseball/mlb':'mlb', 'hockey/nhl':'nhl', 'basketball/nba':'nba', 'soccer/eng.1':'epl',
  'soccer/esp.1':'liga', 'soccer/uefa.champions':'ucl', 'soccer/usa.1':'mls', 'soccer/fifa.world':'wc', 'soccer/fifa.friendly':'fri',
  'soccer/concacaf.nations.league':'cnl', 'soccer/uefa.nations':'unl' };
const KEY_SOC = { epl:1, liga:1, ucl:1, mls:1, wc:1, fri:1, cnl:1, unl:1 }, RUN = { nfl:195, cfb:210, mlb:180, nhl:150, nba:150 };
function feed(d, k, clock) {
  const f = path.join(SMP, d, k + '.json'); if (!fs.existsSync(f)) return { events: [] };
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (clock) for (const e of j.events || []) {
    const c = e.competitions[0], st = +new Date(e.date), run = (RUN[k] || 115) * 60e3, t = c.status.type;
    if (/postponed|canceled/i.test(t.name)) continue;
    let n = 0; for (const x of c.competitors) x.score = String(clock < st ? '' : (n++ * 3 + (e.id % 7) + Math.floor((clock - st) / 1.2e6)) % (KEY_SOC[k] ? 4 : 40));
    if (clock < st) Object.assign(t, { state: 'pre', completed: false });
    else if (clock < st + run) Object.assign(t, { state: 'in', completed: false, shortDetail: k === 'mlb' ? 'Top 5th' : KEY_SOC[k] ? "67'" : k === 'nhl' ? '2nd 8:14' : 'Q3 6:12' });
    else Object.assign(t, { state: 'post', completed: true, shortDetail: 'Final' });
  }
  return j;
}
const CASES = [
  { tag: 'today', days: ['20261009', '20261010'], clock: 0, golf: true },
  { tag: 'busy', days: ['20261010', '20261011'], clock: +new Date('2026-10-10T20:30:00Z'), golf: false },
];
(async () => {
  const b = await chromium.launch(), rows = [], errs = [];
  for (const [w, h, mob] of [[375, 667, true], [390, 844, true], [1440, 900, false]]) {   // the landing page pills
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push('landing @' + w + ': ' + e.message));
    await p.route('**', r => { const u = r.request().url(); return u.startsWith('http://localhost:') && !u.endsWith("/sw.js") ? r.continue() : u.includes("fonts.g") ? r.continue() : (u.includes("site.api.espn") || u.includes("statsapi")) ? r.fulfill({ json: { events: [], dates: [] } }) : r.abort(); });
    await p.goto('http://localhost:' + srv.port + '/'); await p.waitForTimeout(1200);
    const L = await p.evaluate(() => { const ps = [...document.querySelectorAll('a.live')].map(a => ({ t: a.textContent.trim(), href: a.getAttribute('href'), r: a.getBoundingClientRect() }));
      return { ps: ps.map(x => x.t + ' ' + x.href), inside: ps.every(x => x.r.left >= 0 && x.r.right <= innerWidth), oneRow: ps.every(x => Math.abs(x.r.top - ps[0].r.top) < 2), docW: document.documentElement.scrollWidth, vw: innerWidth }; });
    ok(L.ps.length === 3 && L.ps[0] === "Live https://sloanescott16.github.io/live/" && L.ps[1] === "Schedule https://sloanescott16.github.io/schedule/" && /^Players /.test(L.ps[2]),
      'landing @' + w + ': pills Live (to /live/), Schedule (to /schedule/), Players (' + L.ps.join(' | ') + ')');
    ok(L.inside && L.docW <= L.vw, 'landing @' + w + ': the pills sit inside the screen, no sideways scroll (' + L.docW + ' of ' + L.vw + (L.oneRow ? ', one row' : ', wrapped') + ')');
    await p.screenshot({ path: path.join(OUT, 'split-' + LABEL + '-landing-' + w + '.png') });
    await ctx.close();
  }
  for (const pg of (process.env.PAGES || 'schedule,live').split(',')) for (const cs of CASES) for (const [w, h, mob] of [[375, 667, true], [390, 844, true], [1440, 900, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }), p = await ctx.newPage(), tag = pg + ' ' + cs.tag + ' @' + w + 'x' + h;
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    if (cs.clock) await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const off = ${cs.clock} - Date.now(), D = Date;
      class F extends D { constructor(...a) { a.length ? super(...a) : super(D.now() + off); } static now() { return D.now() + off; } } window.Date = F; })();` });
    await p.route('**', r => { const u = r.request().url(); return u.startsWith('http://localhost:') && !/\/sw\.js$/.test(u) ? r.continue() : r.abort(); });
    await p.route(/^https:\/\/(a\.espncdn\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, r => r.continue());
    await p.route(/^https:\/\/site\.api\.espn\.com\/apis\/site\/v2\/sports\//, r => {
      const u = new URL(r.request().url()), m = /sports\/(.+)\/scoreboard/.exec(u.pathname), d = u.searchParams.get('dates');
      if (m && /^golf\//.test(m[1])) { const f = path.join(SMP, 'golf-20261009', m[1].split('/')[1] + '.json'); return r.fulfill({ json: cs.golf && fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { events: [] } }); }
      const k = m && KEY[m[1]]; if (!k || (d && !cs.days.includes(d))) return r.fulfill({ json: { events: [] } });
      return r.fulfill({ json: feed(d || cs.days[0], k, cs.clock) });
    });
    await p.route(/^https:\/\/statsapi\.mlb\.com\//, r => r.fulfill({ body: fs.readFileSync(path.join(SMP, cs.days[0], 'statsapi.json'), 'utf8'), contentType: 'application/json' }));
    await p.goto('http://localhost:' + srv.port + '/' + pg + '/');
    try { await p.waitForFunction(() => /^Updated/.test((document.getElementById('meta') || {}).textContent || ''), undefined, { timeout: 20000 }); } catch (e) { errs.push(tag + ': no update stamp'); }
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const de = document.documentElement, dg = document.getElementById('dg');
      const wide = [...document.querySelectorAll('body *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.left < -1) && !(dg && dg.contains(e) && e !== dg); }).slice(0, 5).map(e => e.tagName + '.' + e.className);
      return { vw: innerWidth, vh: innerHeight, docW: de.scrollWidth, docH: de.scrollHeight, boardW: dg ? dg.scrollWidth : 0, boardClientW: dg ? dg.clientWidth : 0, boardH: dg ? dg.scrollHeight : 0, boardClientH: dg ? dg.clientHeight : 0, wide }; });
    r.page = pg; r.case = cs.tag; rows.push(r);
    const c = await p.evaluate(() => ({ ver: (document.querySelector('meta[name="pb-version"]') || {}).content, title: document.title, dg: !!document.getElementById('dg'), heads: [...document.querySelectorAll('#app h2')].map(h => h.textContent),
      cards: document.querySelectorAll('#app .grid > *').length, blocks: document.querySelectorAll('.b').length }));
    if (pg === 'live') {
      ok(c.ver === 'Live v13' && !c.dg, tag + ': Live is the classic scoreboard (' + c.ver + ', no day grid)');
      if (cs.clock) ok(c.cards > 0 && c.heads.some(t => /[0-9]+ live$/.test(t)), tag + ': live games as cards under their league heads (' + c.cards + ' cards; ' + c.heads.filter(t => /live$/.test(t)).join(', ') + ')');
      ok(c.heads.some(t => /^Later today/.test(t)) || c.heads.some(t => /^Finals today/.test(t)), tag + ': Later today and Finals today lists below, as in the classic page');
    } else {
      ok(c.ver === 'Schedule v1' && c.dg && c.blocks > 0 && /Schedule · Press Box$/.test(c.title), tag + ': Schedule is the day grid (' + c.ver + ', ' + c.blocks + ' cards, title "' + c.title + '")');
      if (w < 560) ok(r.boardW <= r.boardClientW, tag + ': the board does not scroll sideways (' + r.boardW + ' of ' + r.boardClientW + ')');
    }
    ok(r.docW <= r.vw, tag + ': the page does not scroll sideways (' + r.docW + ' of ' + r.vw + ')');
    console.log(tag + ': page ' + r.docW + 'x' + r.docH + ' in ' + r.vw + 'x' + r.vh + (r.page === 'schedule' ? ' | board content ' + r.boardW + 'x' + r.boardH + ' in ' + r.boardClientW + 'x' + r.boardClientH : '') + (r.wide.length ? ' | past the edge: ' + r.wide.join(' ') : ''));
    await p.screenshot({ path: path.join(OUT, 'split-' + LABEL + '-' + pg + '-' + cs.tag + '-' + w + '.png') });
    await ctx.close();
  }
  await b.close(); srv.stop(true);
  fs.writeFileSync(path.join(__dirname, 'measure-' + LABEL + '.json'), JSON.stringify(rows, null, 1));
  ok(!errs.length, 'no page errors' + (errs.length ? ':\n' + errs.join('\n') : ''));
  console.log('\n' + (fail ? 'FAILED' : 'PASSED') + ' ' + pass + '/' + (pass + fail)); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
