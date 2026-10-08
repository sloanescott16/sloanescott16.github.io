/* Page check for the golf live fix: Press Box v33 golf tile and The Green v9 header and hero.
   bun _tests/golf-live/test-page.js   (serves this worktree on localhost; every ESPN call is answered from
   the saved samples, nothing reaches the internet; screenshots in _tests/golf-live/shots)
   Tee-time wording assumes it runs before 6:45 PM Central on 2026-10-08, as it did. */
const { chromium } = require('./pw-shim.js');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), SMP = path.join(__dirname, 'samples');
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const J = f => JSON.parse(fs.readFileSync(path.join(SMP, f), 'utf8'));
/* the test server never serves sw.js: Chrome fetches the worker script outside the page's request interception,
   and a pass-through worker would carry the page's feed requests past the mocks to the real ESPN */
const srv = Bun.serve({ port: 0, fetch(req) { let p = decodeURIComponent(new URL(req.url).pathname); if (p.endsWith('/')) p += 'index.html';
  if (/\/sw\.js$/.test(p)) return new Response('nf', { status: 404 }); const f = path.join(ROOT, p);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? new Response(Bun.file(f)) : new Response('nf', { status: 404 }); } });

// a suspended Round 1, made from the real Korn Ferry feed (no live suspension exists today)
function suspended(f) { const j = J(f); const c = j.events[0].competitions[0]; c.status.type = { id: '6', name: 'STATUS_SUSPENDED', state: 'in', description: 'Suspended', detail: 'Round 1 - Suspended', shortDetail: 'Round 1 - Suspended' }; return j; }
const CASES = [
  { tag: 'between-rounds', sb: J('pga-scoreboard-r1-complete-2026-10-08.json'), lb: J('pga-leaderboard-r1-complete-r2-tees-2026-10-08.json'), live: false, gq: 'R2 tees off 6:45 PM' },
  { tag: 'in-round', sb: J('kft-scoreboard-r1-in-progress-2026-10-08.json'), lb: J('kft-leaderboard-r1-in-progress-2026-10-08.json'), live: true, gq: '' },
  { tag: 'suspended', sb: suspended('kft-scoreboard-r1-in-progress-2026-10-08.json'), lb: suspended('kft-leaderboard-r1-in-progress-2026-10-08.json'), live: false, gq: 'Round 1 suspended' },
  { tag: 'final', sb: J('pga-leaderboard-final-bank-of-utah.json'), lb: J('pga-leaderboard-final-bank-of-utah.json'), live: false, gq: '' },
  { tag: 'leaderboard-down', sb: J('pga-scoreboard-r1-complete-2026-10-08.json'), lb: null, live: false, gq: 'Round 1 complete' },
];
let pass = 0, fail = 0; function ok(c, m) { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } }

async function page(b, w, mob, cs, errs, tag) {
  const ctx = await b.newContext({ viewport: { width: w, height: mob ? 844 : 900 }, isMobile: mob, hasTouch: mob }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(tag + ': ' + e.message));
  /* the pass-through service worker claims the page and its fetches would bypass these routes and reach the real
     ESPN feed, so the worker is refused here; it only forwards requests, so the page logic is the same */
  await p.route('**', r => { const u = r.request().url(); return u.startsWith('http://localhost:') && !/\/sw\.js$/.test(u) ? r.continue() : r.abort(); });
  p.golfHits = [];
  await p.route(/^https:\/\/(site|site\.web)\.api\.espn\.com\//, r => {
    const u = r.request().url(); if (/golf/.test(u)) p.golfHits.push(u.replace(/^https:\/\/[^/]+/, ''));
    if (/golf\/pga\/scoreboard/.test(u)) return r.fulfill({ json: cs.sb });
    if (/golf\/(pga\/)?leaderboard/.test(u)) return cs.lb ? r.fulfill({ json: cs.lb }) : r.fulfill({ status: 500, body: 'down' });
    return r.fulfill({ json: { events: [], leagues: [] } });
  });
  await p.route(/^https:\/\/statsapi\.mlb\.com\//, r => r.fulfill({ json: { dates: [] } }));
  return { ctx, p };
}

(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const cs of CASES) {
    for (const [w, mob] of [[1280, false], [390, true]]) {
      const tag = 'landing ' + cs.tag + ' @' + w;
      const { ctx, p } = await page(b, w, mob, cs, errs, tag);
      await p.goto('http://localhost:' + srv.port + '/index.html');
      await p.waitForTimeout(2500);
      const r = await p.evaluate(() => { const t = document.getElementById('tGolf'), lv = t.querySelector('.lv'), q = t.querySelector('.gq');
        return { on: t.classList.contains('on'), lv: getComputedStyle(lv).display, border: getComputedStyle(t).borderTopColor, gq: q.textContent, gqShown: getComputedStyle(q).display !== 'none', aria: t.getAttribute('aria-label'),
          gqFits: q.scrollWidth <= q.clientWidth + 1, gqW: q.getBoundingClientRect().width, tileW: t.getBoundingClientRect().width }; });
      const red = /239, 68, 68/.test(r.border);
      ok(r.on === cs.live && (r.lv !== 'none') === cs.live && red === cs.live, tag + ': live styling ' + cs.live + ' (class on ' + r.on + ', badge ' + r.lv + ', border ' + r.border + ')');
      ok(r.gq === cs.gq && r.gqShown === !!cs.gq, tag + ': quiet line "' + r.gq + '" shown ' + r.gqShown + ' (want "' + cs.gq + '")');
      if (cs.gq) ok(r.gqFits, tag + ': quiet line fits the tile (' + Math.round(r.gqW) + ' of ' + Math.round(r.tileW) + ' px, no clipping)');
      console.log('   aria-label:', r.aria); console.log('   golf feeds answered from samples:', [...new Set(p.golfHits)].join(' , '));
      ok(p.golfHits.some(u => /scoreboard/.test(u)) && (!cs.gq && !cs.live || p.golfHits.some(u => /leaderboard/.test(u))), tag + ': golf feeds were answered from the samples');
      ok(await p.evaluate(() => !navigator.serviceWorker || !navigator.serviceWorker.controller), tag + ': no service worker between the page and the mocks');
      await p.screenshot({ path: path.join(OUT, 'landing-' + cs.tag + '-' + w + '.png') });
      await ctx.close();
    }
    if (cs.tag === 'leaderboard-down') continue;
    const tag = 'the-green ' + cs.tag;
    const { ctx, p } = await page(b, 1280, false, cs, errs, tag);
    await p.goto('http://localhost:' + srv.port + '/the-green/#home');
    await p.waitForTimeout(3000);
    const g = await p.evaluate(() => ({ st: document.getElementById('stText').textContent, dot: getComputedStyle(document.getElementById('dot')).display, heroLive: !!document.querySelector('#hero .lv'), kick: (document.querySelector('#hero .kick span') || {}).textContent || '', who: (document.querySelector('#hero .spot .k') || {}).textContent || '' }));
    if (cs.tag === 'between-rounds') ok(!/^Starts/.test(g.kick) && g.who === 'Leader', tag + ': hero shows the round so far, not the week ahead (kick "' + g.kick + '", spot "' + g.who + '")');
    ok((g.dot !== 'none') === cs.live && g.heroLive === cs.live && (cs.live ? g.st === 'Live' : g.st !== 'Live'), tag + ': header "' + g.st + '", dot ' + g.dot + ', hero live tag ' + g.heroLive + ' (want live ' + cs.live + ')');
    await p.screenshot({ path: path.join(OUT, 'the-green-' + cs.tag + '.png') });
    await ctx.close();
  }
  await b.close(); srv.stop(true);
  ok(!errs.length, 'no page errors' + (errs.length ? ':\n' + errs.join('\n') : ''));
  console.log('\n' + (fail ? 'FAILED' : 'PASSED') + ' ' + pass + '/' + (pass + fail)); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
