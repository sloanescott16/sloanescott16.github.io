// One-off edit (The Green v9, part 2): a round already played counts as started, so between rounds the page
// does not fall back to the "week ahead" view once ESPN rolls every player over to the next round's tee times.
const fs=require('fs'), P=process.argv[2]; let h=fs.readFileSync(P,'utf8');
const a="  var anyStarted=ps.some(function(p){return p.started;});\r\n";
if(h.split(a).length!==2) throw 'nf';
h=h.replace(a,"  var anyStarted=ps.some(function(p){return p.started;})||(comp.competitors||[]).some(function(p){ return (p.linescores||[]).some(function(l){return l.value>50;}); }); /* v9: a finished round counts */\r\n");
fs.writeFileSync(P,h);
