// Logic test for golfNow(). Run: bun test-golfnow.js   (no network; reads saved real ESPN samples)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), S = f => JSON.parse(fs.readFileSync(path.join(__dirname, 'samples', f), 'utf8'));
function grab(file) {
  const h = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
  const a = h.indexOf('/* GOLFNOW-START'), b = h.indexOf('/* GOLFNOW-END */');
  if (a < 0 || b < 0) throw new Error('no golfNow in ' + file);
  return h.slice(a, b + 17);
}
const land = grab('index.html'), green = grab('the-green/index.html');
let pass = 0, fail = 0;
function ok(c, msg) { if (c) { pass++; console.log('PASS', msg); } else { fail++; console.log('FAIL', msg); } }
ok(land === green, 'golfNow is the same code in index.html and the-green/index.html');
ok(land === grab('live/index.html'), 'golfNow is the same code in live/index.html (Live v11 golf column)');
const golfNow = new Function(land + '\nreturn golfNow;')();
const clone = o => JSON.parse(JSON.stringify(o)), ev = f => clone(S(f).events[0]);
const T = s => Date.parse(s), NOW = T('2026-10-08T21:24:00Z');   // when the samples were fetched (4:24 PM Central)
function is(name, e, now, live, text) {
  const g = golfNow(e, now);
  ok(g.live === live && (text === undefined || g.text === text),
    name + ' -> live ' + g.live + ', "' + g.text + '"' + (text !== undefined ? ' (want live ' + live + ', "' + text + '")' : ' (want live ' + live + ')'));
  return g;
}
function oldLanding(e) { return !!(e && e.status && e.status.type && e.status.type.state === 'in'); }
function setComp(e, type, period) { const c = e.competitions[0]; c.status.type = Object.assign({}, c.status.type, type); if (period) c.status.period = period; return e; }

// 1. Real: PGA scoreboard, event "In Progress", competition "Round 1 - Play Complete". The v32 tile said LIVE.
const sb = ev('pga-scoreboard-r1-complete-2026-10-08.json');
ok(oldLanding(sb) === true, 'v32 rule shows this real between-rounds feed as live (the bug)');
is('real PGA scoreboard, R1 play complete', sb, NOW, false, 'Round 1 complete');
// 2. Real: PGA leaderboard, same moment, all 72 players "pre" for Round 2 with tee times
const lb = ev('pga-leaderboard-r1-complete-r2-tees-2026-10-08.json');
is('real PGA leaderboard, R1 complete, R2 tee times posted', lb, NOW, false, 'R2 tees off 6:45 PM');
is('same feed seen the evening before (Wed 11 PM CT)', lb, T('2026-10-08T04:00:00Z'), false, 'R2 tees off Thu 6:45 PM');
is('same feed, ten minutes before the first R2 tee (6:45 PM CT)', lb, T('2026-10-08T23:35:00Z'), false, 'R2 tees off 6:45 PM');
is('feed not yet updated after the first tee: names the next group, still not live', lb, T('2026-10-09T00:30:00Z'), false, 'R2 tees off 7:40 PM');
// 3. Real: Korn Ferry, Round 1 in progress, 15 players on the course, 44 finished
const kl = ev('kft-leaderboard-r1-in-progress-2026-10-08.json');
is('real KFT leaderboard, R1 in progress with players on course', kl, NOW, true, 'Round 1');
const ks = ev('kft-scoreboard-r1-in-progress-2026-10-08.json');
is('real KFT scoreboard, R1 in progress (no player status)', ks, NOW, true, 'Round 1');
// 4. Real: tournament final, and the Presidents Cup final (match play, nested competitions)
is('real PGA final (Bank of Utah)', ev('pga-leaderboard-final-bank-of-utah.json'), NOW, false, 'Final');
is('real Presidents Cup final', ev('pga-leaderboard-presidents-cup-final.json'), NOW, false, 'Final');
// 5. Real: before the week starts, and another tour between rounds
is('real Champions scoreboard, event scheduled', ev('champions-scoreboard-pre-event-2026-10-08.json'), NOW, false, '');
is('real European Tour scoreboard, R1 play complete', ev('eur-scoreboard-r1-complete-2026-10-08.json'), NOW, false, 'Round 1 complete');

// Derived from the real KFT feed: suspended and delayed wording (no live sample of these exists today)
let e = setComp(clone(kl), { id: '6', name: 'STATUS_SUSPENDED', state: 'in', description: 'Suspended', detail: 'Round 1 - Suspended', shortDetail: 'Round 1 - Suspended' });
is('R1 suspended, players still marked in progress', e, NOW, false, 'Round 1 suspended');
e = setComp(clone(kl), { name: 'STATUS_IN_PROGRESS', state: 'in', description: 'In Progress', detail: 'Round 1 - Suspended due to darkness', shortDetail: 'Round 1 - Suspended' });
is('R1 suspended due to darkness (wording only in detail)', e, NOW, false, 'Round 1 suspended');
e = setComp(clone(ks), { id: '7', name: 'STATUS_DELAYED', state: 'in', description: 'Delayed', detail: 'Round 1 - Delayed', shortDetail: 'Round 1 - Delayed' });
is('scoreboard only, R1 delayed', e, NOW, false, 'Round 1 delayed');
e = setComp(clone(kl), { name: 'STATUS_RAIN_DELAY', state: 'in', description: 'Rain Delay', detail: 'Round 1 - Rain Delay', shortDetail: 'Rain Delay' });
is('R1 rain delay', e, NOW, false, 'Round 1 delayed');
e = clone(kl);
e.competitions[0].competitors.filter(p => p.status.type.state === 'in').forEach(p => { p.status.type = { name: 'STATUS_SUSPENDED', state: 'in', description: 'Suspended' }; });
is('every player on course marked suspended, competition not yet', e, NOW, false);
// Overnight: everyone finished, ESPN not yet flipped the competition (and once it has)
e = clone(kl);
e.competitions[0].competitors.forEach(p => { if (p.status.type.state === 'in') { p.status.type = { id: '2', name: 'STATUS_FINISH', state: 'post', description: 'Finish' }; p.status.thru = 18; } });
is('all R1 players finished, competition still says in progress', e, NOW, false, 'Round 1 complete');
setComp(e, { id: '35', name: 'STATUS_PLAY_COMPLETE', state: 'post', description: 'Play Complete', detail: 'Round 1 - Play Complete' });
is('all R1 players finished, competition says play complete', e, NOW, false, 'Round 1 complete');
// ESPN flips the competition to Round 2 early, before anyone tees off
e = setComp(clone(lb), { id: '2', name: 'STATUS_IN_PROGRESS', state: 'in', description: 'In Progress', detail: 'Round 2 - In Progress' }, 2);
is('competition says R2 in progress but every tee time is still ahead', e, NOW, false, 'R2 tees off 6:45 PM');
// First group goes out: one player in progress
const first = e.competitions[0].competitors.slice().sort((a, b) => T(a.status.teeTime) - T(b.status.teeTime))[0];
first.status.type = { id: '2', name: 'STATUS_IN_PROGRESS', state: 'in', description: 'In Progress' }; first.status.thru = 1;
is('first R2 group on the course', e, T('2026-10-09T00:55:00Z'), true, 'Round 2');
// Players say on course but the competition still says play complete (ESPN lag): trust the players
e = clone(lb); const p0 = e.competitions[0].competitors.slice().sort((a, b) => T(a.status.teeTime) - T(b.status.teeTime))[0];
p0.status.type = { name: 'STATUS_IN_PROGRESS', state: 'in', description: 'In Progress' };
is('player in progress while competition lags at play complete', e, T('2026-10-09T01:00:00Z'), true);
// Cup week: a match in progress is live, a suspended one is not
e = ev('pga-leaderboard-presidents-cup-final.json'); e.status.type = { name: 'STATUS_IN_PROGRESS', state: 'in', description: 'In Progress' };
const cm = [].concat(...e.competitions); cm.forEach(c => { c.status.type = { name: 'STATUS_FINAL', state: 'post', description: 'Final' }; });
cm[0].status.type = { name: 'STATUS_IN_PROGRESS', state: 'in', description: 'In Progress', detail: 'Thru 7' };
is('cup week, one match on the course', e, NOW, true);
cm[0].status.type = { name: 'STATUS_SUSPENDED', state: 'in', description: 'Suspended', detail: 'Suspended' };
is('cup week, only match left is suspended', e, NOW, false);
is('no event at all', undefined, NOW, false, '');
console.log('\n' + (fail ? 'FAILED' : 'PASSED') + ' ' + pass + '/' + (pass + fail));
process.exit(fail ? 1 : 0);
