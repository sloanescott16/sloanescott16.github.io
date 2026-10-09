/* Page check for Live v10, the day grid turned on its side (sport columns, hours down the right).  bun _tests/live-daygrid/test-page.js
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
  { tag: 'busy-saturday', days: ['20261010', '20261011'], clock: +new Date('2026-10-10T20:30:00Z'), late: true, stars: true, rival: true },
];
async function open(b, w, mob, cs, errs, hgt) {
  const ctx = await b.newContext({ viewport: { width: w, height: hgt || (mob ? 844 : 900) }, isMobile: mob, hasTouch: mob }); const p = await ctx.newPage();
  const tag = cs.tag + ' @' + w + 'x' + hgt; p.on('pageerror', e => errs.push(tag + ': ' + e.message));
  await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { window.__cerr = []; const ce = console.error.bind(console); console.error = (...a) => { window.__cerr.push(a.map(String).join(' ')); ce(...a); }; })();` });   // v10: console errors count as failures too
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
  // v10: the PC (1440x900) and two phones (390x844, 375x667); screenshots at the PC and the 390 phone
  for (const cs of CASES) for (const [w, mob, hgt] of [[1440, false, 900], [390, true, 844], [375, true, 667]]) {
    const { ctx, p, tag } = await open(b, w, mob, cs, errs, hgt);
    const shot = (extra) => path.join(OUT, 'live-v10-' + (mob ? 'phone' : 'pc') + '-' + (cs.tag === 'today' ? 'today' : 'busy') + (extra ? '-' + extra : '') + '.png');
    const shoot = w !== 375;
    await p.goto('http://localhost:' + srv.port + '/live/');
    await p.waitForFunction(() => document.getElementById('meta').textContent.startsWith('Updated'), undefined, { timeout: 20000 });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const dg = document.getElementById('dg'), now = dg.querySelector('.now'), hd = dg.querySelector('.hd'), gut = dg.querySelector('.gut'), labs = [...dg.querySelectorAll('.hd .ch img')];
      const nr = now && now.getBoundingClientRect(), gr = dg.getBoundingClientRect(), hr = hd ? hd.getBoundingClientRect() : gr, ur = gut ? gut.getBoundingClientRect() : gr;
      const seenY = y => y >= hr.bottom - 1 && y <= gr.bottom;
      const chs = [...dg.querySelectorAll('.hd .ch')].map(c => c.getBoundingClientRect());
      const bs = [...dg.querySelectorAll('.b')];
      const byCol = {}; for (const x of bs) (byCol[x.dataset.col] = byCol[x.dataset.col] || []).push(x);
      return { cols: labs.map(i => i.alt), imgs: labs.every(i => i.complete && i.naturalWidth > 0), blocks: bs.length, live: dg.querySelectorAll('.b.in').length,
        nowSeen: !!nr && seenY(nr.top), nowFlat: !!now && now.offsetWidth > 20 * now.offsetHeight && now.offsetWidth >= dg.querySelector('.cols').offsetWidth - 1,
        nowMark: !!dg.querySelector('.gut .nt') && (() => { const t = dg.querySelector('.gut .nt').getBoundingClientRect(); return t.left >= ur.left - 1 && Math.abs((t.top + t.height / 2) - nr.top) < 3; })(),
        firstSeen: (() => { const p = [...dg.querySelectorAll('.b.pre')].map(x => x.getBoundingClientRect().top).sort((a, c) => a - c)[0]; return p != null && seenY(p); })(),
        anyLive: !!dg.querySelector('.b.in'),
        lanes: Math.max(0, ...Object.values(byCol).map(l => new Set(l.map(x => x.style.left)).size)),
        byTime: Object.values(byCol).every(l => { const s = l.map(x => [+x.dataset.s, x.offsetTop]).sort((a, c) => a[0] - c[0] || a[1] - c[1]); return s.every((v, i) => !i || v[1] >= s[i - 1][1]); }),
        colOk: bs.every(x => { const c = [...dg.querySelectorAll('.hd .ch')].find(h => h.dataset.k === x.dataset.col); return !!c && x.offsetLeft >= c.offsetLeft - 1 && x.offsetLeft + x.offsetWidth <= c.offsetLeft + c.offsetWidth + 1; }),
        hoursRight: !!gut && chs.every(c => c.right <= ur.left + 1) && Math.abs(ur.right - (gr.left + dg.clientLeft + dg.clientWidth)) < 2,
        hourNames: gut ? [...gut.querySelectorAll('.hr')].map(h => h.textContent) : [],
        allColsSeen: chs.every(c => c.left >= gr.left - 1 && c.right <= ur.left + 1),
        gridBottom: Math.round(gr.bottom), winH: innerHeight,
        more: [...dg.querySelectorAll('.more')].map(m => m.dataset.more + ' ' + m.textContent), scrolls: dg.scrollWidth > dg.clientWidth + 2, scrollsY: dg.scrollHeight > dg.clientHeight + 2,
        scrollLeft: dg.scrollLeft, scrollTop: dg.scrollTop,
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1, tabs: document.querySelectorAll('h2,.li').length,
        late: !!dg.querySelector('.b[data-g="nba:999000111"]'), gutW: gut ? gut.offsetWidth : 0, sum: document.getElementById('sum').textContent,
        back: !!document.querySelector('header a.back[href]'), stamp: /^Updated \d/.test(document.getElementById('meta').textContent),
        overlap: (() => { const rs = bs.map(x => x.getBoundingClientRect()); for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i], c = rs[j];
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) return true; } return false; })() }; });
    console.log('   ' + tag + ': columns ' + r.cols.join(', ') + ' | blocks ' + r.blocks + ' | live ' + r.live + ' | ' + r.sum + ' | scroll ' + r.scrollLeft + ',' + r.scrollTop + ' | hours ' + r.hourNames[0] + '..' + r.hourNames[r.hourNames.length - 1]);
    ok(r.cols.length > 0 && r.imgs, tag + ': one column per sport with its picture loaded in the header');
    ok(r.tabs === 0, tag + ': the old league sections and chip list rows are gone');
    ok(r.back && r.stamp && /\d+ live.*\d+ still to come.*\d+ final/.test(r.sum), tag + ': Press Box button, update stamp and the summary line are there');
    ok(r.anyLive ? r.nowSeen : (r.nowSeen || r.firstSeen), tag + ': opens at now, or at the first game if nothing is on yet');
    ok(r.nowFlat && r.nowMark, tag + ': the now line runs across the board, its time marked on the right by the hours');
    ok(r.hoursRight && r.hourNames.length >= 3 && r.hourNames.every(h => /^(\d+ (AM|PM)|Noon)$/.test(h)), tag + ': the hours run down the right-hand side (' + r.hourNames.length + ' names)');
    ok(r.byTime, tag + ': in each column the cards run down by start time');
    ok(r.colOk, tag + ': every card sits inside its own sport\'s column');
    ok(r.lanes <= 3, tag + ': no sport column takes more than 3 lanes (' + r.lanes + ')' + (r.more.length ? ', ' + r.more.join(', ') : ''));
    if (!mob) ok(!r.scrolls && r.allColsSeen, tag + ': every sport column shows across the width, no sideways scroll');
    ok(r.gridBottom <= r.winH, tag + ': the board fits the window (ends at ' + r.gridBottom + ' of ' + r.winH + ')');
    ok(!r.overlap, tag + ': no two game cards overlap');
    ok(!r.pageOverflow, tag + ': the page itself does not scroll sideways');
    ok(r.gutW === (mob ? 50 : 62), tag + ': first drawing uses the ' + (mob ? 'phone' : 'desk') + ' layout (hours ' + r.gutW + ' px)');
    if (cs.late) ok(r.late, tag + ': an 11:15 PM Central game from the next day\'s board shows tonight');
    if (cs.clock) ok(r.live > 0, tag + ': live games marked (' + r.live + ')');
    {   // publish-v9: the "+N more" chip shows its whole text, never clipped
      const cl = await p.evaluate(() => [...document.querySelectorAll('.more')].map(m => ({ t: m.textContent, clip: m.scrollWidth > m.clientWidth + 1 || m.getBoundingClientRect().right > m.closest('.ch').getBoundingClientRect().right + 0.5 || m.getBoundingClientRect().bottom > m.closest('.ch').getBoundingClientRect().bottom + 0.5 })));
      if (cl.length) ok(cl.every(x => !x.clip), tag + ': "+N more" chip text not clipped (' + cl.map(x => x.t + (x.clip ? ' CLIPPED' : '')).join(', ') + ')');
    }
    {   // live cards: red outline, clock and period; finals say so; upcoming ones carry time and network
      const c = await p.evaluate(() => { const one = s => { const e = document.querySelector('.b.' + s); return e ? { m2: e.querySelector('.m2').textContent, bc: getComputedStyle(e).borderTopColor, lines: e.querySelectorAll('.m1').length, clip: e.scrollHeight > e.clientHeight + 1 } : null; };
        return { in: one('in'), post: one('post'), pre: one('pre'), clip: [...document.querySelectorAll('.b')].filter(e => e.querySelectorAll('.m1').length !== 2 || e.querySelector('.m2').getBoundingClientRect().bottom > e.getBoundingClientRect().bottom + 0.5).length }; });
      if (c.in) ok(/239, 68, 68/.test(c.in.bc) && /\d/.test(c.in.m2), tag + ': a live card is red-outlined with its clock (' + c.in.m2 + ')');
      if (c.post) ok(/final/i.test(c.post.m2), tag + ': a final card says Final (' + c.post.m2 + ')');
      if (c.pre) ok(/\d+(:\d\d)? (AM|PM)/.test(c.pre.m2), tag + ': an upcoming card shows its start time (' + c.pre.m2 + ')');
      ok(c.clip === 0, tag + ': every card shows both sides and its status line inside the card (' + c.clip + ' short)');
    }
    if (shoot) await p.screenshot({ path: shot() });
    {   // the pins: league heads stay on top when the hours scroll, the hours stay on the right when the columns scroll sideways
      const s = await p.evaluate(() => { const dg = document.getElementById('dg'), hd = dg.querySelector('.hd .ch'), hr = dg.querySelector('.gut .hr');
        const t0 = hd.getBoundingClientRect().top, l0 = hr.getBoundingClientRect().left, y0 = dg.scrollTop, x0 = dg.scrollLeft;
        const ys = dg.scrollHeight > dg.clientHeight + 2, xs = dg.scrollWidth > dg.clientWidth + 2;
        dg.scrollTop = ys ? (y0 > 150 ? y0 - 150 : y0 + 150) : y0; dg.scrollLeft = xs ? (x0 > 150 ? x0 - 150 : x0 + 150) : x0;
        return new Promise(res => setTimeout(() => res({ ys, xs, moved: [dg.scrollTop - y0, dg.scrollLeft - x0], t: [t0, hd.getBoundingClientRect().top], l: [l0, hr.getBoundingClientRect().left] }), 150)); });
      if (s.ys) ok(s.moved[0] !== 0 && Math.abs(s.t[0] - s.t[1]) < 1, tag + ': sport heads stay pinned on top while the hours scroll (' + s.t.map(Math.round).join(' -> ') + ')');
      if (mob) ok(s.xs ? s.moved[1] !== 0 && Math.abs(s.l[0] - s.l[1]) < 1 : r.allColsSeen, tag + (s.xs ? ': hours stay pinned on the right while the columns scroll sideways (' + s.l.map(Math.round).join(' -> ') + ')' : ': every column fits the phone'));
    }
    if (cs.stars) {   // publish-v9: the Stars game on the grid, and the classic logo in its sheet
      const sb = await p.evaluate(() => { const b = [...document.querySelectorAll('.b[data-g^="nhl:"]')].find(x => /\bDAL\b/.test(x.textContent)); if (b) b.scrollIntoView({ inline: 'center', block: 'center' }); return b ? b.dataset.g : ''; });
      ok(!!sb, tag + ': a Stars game card is on the grid (' + sb + ')');
      if (sb) {
        await p.waitForTimeout(200);
        if (shoot) await p.screenshot({ path: path.join(OUT, 'live-v10-stars-grid-' + w + '.png') });
        await p.click('.b[data-g="' + sb + '"]'); await p.waitForTimeout(500);
        const lg = await p.evaluate(() => [...document.querySelectorAll('#gs .g img')].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 })));
        ok(lg.some(i => /stars-classic-dark.svg$/.test(i.src) && i.ok), tag + ': game sheet shows the classic Stars logo, loaded (' + lg.map(i => i.src.split('/').pop()).join(', ') + ')');
        if (shoot) await p.screenshot({ path: path.join(OUT, 'live-v10-stars-sheet-' + w + '.png') });
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
    }
    if (cs.rival) {   // a rivalry card keeps its badge
      const rv = await p.evaluate(() => [...document.querySelectorAll('.b.rvg .rv')].map(x => x.textContent));
      ok(rv.length > 0, tag + ': rivalry badge on the card (' + rv.join(', ') + ')');
    }
    if (await p.evaluate(() => !!document.querySelector('.more'))) {   // "+N more" opens the full list; a row in it opens that game's card
      const n = (await p.evaluate(() => { const m = document.querySelector('.more'), shown = document.querySelectorAll('.b[data-col="' + m.dataset.more + '"]').length; return { n: shown + parseInt(m.textContent.slice(1), 10) }; })).n;
      await p.click('.more'); await p.waitForTimeout(300);
      const ml = await p.evaluate(() => ({ on: document.getElementById('gs').classList.contains('on'), rows: document.querySelectorAll('#gsb .mi').length }));
      ok(ml.on && ml.rows === n, tag + ': "+N more" opens the full list (' + ml.rows + ' of ' + n + ' games)');
      if (shoot) await p.screenshot({ path: shot('more') });
      await p.click('#gsb .mi:last-child'); await p.waitForTimeout(300);
      ok(await p.evaluate(() => !!document.querySelector('#gsb .g[href]')), tag + ': a game in the list opens its card');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    }
    const pick = cs.clock ? '.b.in' : '.b';
    if (await p.evaluate(s => !!document.querySelector(s), pick)) {
      await p.click(pick); await p.waitForTimeout(400);
      const sh = await p.evaluate(() => { const s = document.getElementById('gs'), g = s.querySelector('.g'); return { on: s.classList.contains('on'), card: !!g, href: g && g.getAttribute('href'), who: s.querySelectorAll('[data-pbp]').length }; });
      ok(sh.on && sh.card && /^https:\/\//.test(sh.href || ''), tag + ': tapping a game opens its card (links to ' + sh.href + ', ' + sh.who + ' player names)');
      if (shoot) await p.screenshot({ path: shot('sheet') });
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok(await p.evaluate(() => !document.getElementById('gs').classList.contains('on')), tag + ': Escape closes the card');
    }
    errs.push(...(await p.evaluate(() => window.__cerr || [])).map(m => tag + ' console: ' + m));
    await ctx.close();
  }
  await b.close(); srv.stop(true);
  ok(!errs.length, 'no page errors' + (errs.length ? ':\n' + errs.join('\n') : ''));
  console.log('\n' + (fail ? 'FAILED' : 'PASSED') + ' ' + pass + '/' + (pass + fail)); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });