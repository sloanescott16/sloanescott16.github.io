/* Saves real ESPN and MLB feeds for a Central date into samples/<date>/ so the page check runs on real data.
   bun _tests/live-daygrid/grab.js 20261009 */
const fs = require('fs'), path = require('path');
const d = process.argv[2]; const OUT = path.join(__dirname, 'samples', d); fs.mkdirSync(OUT, { recursive: true });
const P = { nfl:'football/nfl', cfb:'football/college-football', mlb:'baseball/mlb', nhl:'hockey/nhl', nba:'basketball/nba',
  epl:'soccer/eng.1', liga:'soccer/esp.1', ucl:'soccer/uefa.champions', mls:'soccer/usa.1', wc:'soccer/fifa.world', fri:'soccer/fifa.friendly',
  cnl:'soccer/concacaf.nations.league', unl:'soccer/uefa.nations' };
(async () => {
  for (const [k, p] of Object.entries(P)) {
    const q = k === 'cfb' ? '?groups=80&limit=400&dates=' + d : '?dates=' + d;
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${p}/scoreboard${q}`); const j = await r.json();
    fs.writeFileSync(path.join(OUT, k + '.json'), JSON.stringify(j)); console.log(k, (j.events || []).length);
  }
  const ds = d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6);
  const r = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${ds}&endDate=${ds}`); fs.writeFileSync(path.join(OUT, 'statsapi.json'), await r.text());
})();
