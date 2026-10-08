// One-off edit script used to build Press Box v33 from v32 (kept for the record).
const fs=require('fs'), P=process.argv[2], SN=process.argv[3];
let h=fs.readFileSync(P,'utf8'); const snip=fs.readFileSync(SN,'utf8').replace(/\r?\n/g,'\r\n').trimEnd();
const css='/* v33: golf is live only while players are on the course; between rounds the tile says so quietly */\r\n'+
'.tile .gq{position:absolute;top:12px;right:12px;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:3px 9px}\r\n'+
'.tile .gq:empty,.tile.on .gq{display:none}\r\n@media (max-width:420px){.tile .gq{top:8px;right:8px;max-width:calc(100% - 16px);font-size:10px;padding:2px 7px}}\r\n</style>';
if(h.split('</style>').length!==2) throw 'style'; h=h.replace('</style>',css);
const a='<a class="tile gf" id="tGolf" aria-label="The Green, golf" href="https://sloanescott16.github.io/the-green/#home"><span class="lv"><i></i>Live</span><span class="cup"></span></a>';
if(!h.includes(a)) throw 'tile'; h=h.replace(a,a.replace('<span class="cup">','<span class="gq"></span><span class="cup">'));
const i=h.indexOf('/* v20: golf cup lights up while a tournament round is on */'), j=h.indexOf('</script>',i);
if(i<0||j<0) throw 'script';
const js='/* v20: golf cup lights up while a tournament round is on. v33: only while players are on the course (golfNow) */\r\n'+snip+'\r\n'+
"(function(){var el=document.getElementById('tGolf'),q=el.querySelector('.gq');\r\n"+
"var SB='https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',LB='https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&event=';\r\n"+
"function j(u){return fetch(u,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}\r\n"+
"function show(g){var on=!!g.live,t=on||g.text==='Final'?'':(g.text||'');el.classList.toggle('on',on);q.textContent=t;el.setAttribute('aria-label','The Green, golf'+(on?', live':t?', '+t:''));}\r\n"+
"/* the scoreboard has no per-player status, so while a week is under way ask the leaderboard who is on the course */\r\n"+
"function go(){j(SB).then(function(s){var e=(s.events||[])[0];if(!e){show({});return;}var g=golfNow(e);if(!g.text||g.text==='Final'||g.text==='Canceled'||g.text==='Postponed'){show(g);return;}\r\n"+
"return j(LB+e.id).then(function(l){var x=(l.events||[])[0];show(x&&x.status?golfNow(x):g);},function(){show(g);});}).catch(function(){});}\r\n"+
"go();setInterval(go,60000);document.addEventListener('visibilitychange',function(){if(!document.hidden)go();});})();\r\n";
h=h.slice(0,i)+js+h.slice(j); fs.writeFileSync(P,h);
