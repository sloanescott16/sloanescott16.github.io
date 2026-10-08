/* GOLFNOW-START v33 (Press Box) / v9 (The Green): golf is live only while players are on the course.
   ESPN keeps a tournament "In Progress" all week, overnight too, so the event status alone is not enough.
   Same code in both pages; _tests/golf-live/test-golfnow.js checks the two copies match. */
function golfNow(ev, now){
  now = now == null ? Date.now() : now;
  var STOP = /suspend|delay|postpon|cancel|halt|weather|rain|dark/i;
  function ty(x){ return (x && x.status && x.status.type) || {}; }
  function words(t){ return [t.name, t.description, t.detail, t.shortDetail].join(' '); }
  function when(iso){
    var d = new Date(iso), o = {timeZone:'America/Chicago'};
    var day = function(x){ return x.toLocaleDateString('en-US', {timeZone:'America/Chicago'}); };
    var t = d.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', timeZone:o.timeZone});
    return day(d) === day(new Date(now)) ? t : d.toLocaleDateString('en-US', {weekday:'short', timeZone:o.timeZone}) + ' ' + t;
  }
  var out = {live:false, text:'', round:0};
  if (!ev) return out;
  var es = ty(ev), cs = [];
  (ev.competitions || []).forEach(function(c){ if (Array.isArray(c)) c.forEach(function(y){ cs.push(y); }); else cs.push(c); });
  var c0 = cs[0] || {}, ct = ty(c0);
  var round = out.round = (c0.status && c0.status.period) || 0;
  if (es.state === 'post' || es.completed) {
    out.text = /cancel/i.test(words(es)) ? 'Canceled' : /postpon/i.test(words(es)) ? 'Postponed' : 'Final';
    return out;
  }
  var going = es.state === 'in' || cs.some(function(c){ return ty(c).state === 'in'; });
  if (!going) return out;                                   // before the week starts: nothing to say here
  var stopped = cs.filter(function(c){ return STOP.test(words(ty(c))); })[0] || (STOP.test(words(es)) ? ev : null);
  // per-player status (leaderboard feed, stroke play) is the best evidence; the scoreboard feed has none
  var players = cs.length === 1 ? (c0.competitors || []).filter(function(p){ return ty(p).state; }) : [];
  if (!stopped) {
    if (players.length) {
      out.live = players.some(function(p){
        var t = ty(p), tee = p.status.teeTime ? Date.parse(p.status.teeTime) : NaN;
        return t.state === 'in' && !STOP.test(words(t)) && !(tee > now + 60e3);
      });
    } else {
      out.live = cs.some(function(c){ var t = ty(c); return t.state === 'in' && !/complete|final/i.test(words(t)); });
    }
  }
  if (out.live) { out.text = round ? 'Round ' + round : 'On the course'; return out; }
  if (stopped) {
    var w = words(ty(stopped)) + ' ' + words(es), r = (stopped.status && stopped.status.period) || round;
    out.text = (r ? 'Round ' + r + ' ' : 'Play ') + (/suspend|halt|dark/i.test(w) ? 'suspended' : /postpon/i.test(w) ? 'postponed' : /cancel/i.test(w) ? 'canceled' : 'delayed');
    return out;
  }
  var next = players.filter(function(p){ return ty(p).state === 'pre' && p.status.teeTime && Date.parse(p.status.teeTime) > now; })
    .sort(function(a, b){ return Date.parse(a.status.teeTime) - Date.parse(b.status.teeTime); })[0];
  if (next) {
    var nr = next.status.period || round;
    out.next = next.status.teeTime;
    out.text = (nr ? 'R' + nr + ' tees off ' : 'Tees off ') + when(next.status.teeTime);
    return out;
  }
  var allDone = players.length && players.every(function(p){ return ty(p).state === 'post'; });
  if (round && (/complete/i.test(words(ct)) || allDone)) out.text = 'Round ' + round + ' complete';
  else out.text = 'Between rounds';
  return out;
}
/* GOLFNOW-END */
