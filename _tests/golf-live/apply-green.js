// One-off edit script used to build The Green v9 from v8 (kept for the record).
const fs=require('fs'), P=process.argv[2], SN=process.argv[3];
let h=fs.readFileSync(P,'utf8'); const snip=fs.readFileSync(SN,'utf8').replace(/\r?\n/g,'\r\n').trimEnd();
function rep(a,b){ if(h.split(a).length!==2) throw new Error('not unique: '+a.slice(0,80)); h=h.replace(a,b); }
const fl="function flat(c){ var o=[]; (c||[]).forEach(function(x){ if(Array.isArray(x)) x.forEach(function(y){o.push(y);}); else o.push(x); }); return o; }\r\n";
rep(fl, fl+snip+'\r\n');
rep("  var anyStarted=ps.some(function(p){return p.started;});\r\n",
    "  var anyStarted=ps.some(function(p){return p.started;});\r\n  var G=golfNow(ev); /* v9: live means players on the course, not just a week under way */\r\n");
rep("leader:leader, anyStarted:anyStarted,", "leader:leader, anyStarted:anyStarted, onCourse:G.live, quiet:G.text,");
rep("+(m.state==='in'?'<span class=\"lv\">● live</span>':'')+", "+(m.onCourse?'<span class=\"lv\">● live</span>':'')+");
rep("stt.textContent=m.state==='in'?'Live':fin?'Final':'Next up';", "stt.textContent=m.onCourse?'Live':fin?'Final':(m.state==='in'&&m.quiet)?m.quiet:'Next up';");
rep("document.getElementById('dot').style.display=m.state==='in'?'':'none';", "document.getElementById('dot').style.display=m.onCourse?'':'none';");
rep("var live=S.cup?points(S.cup).live:(S.ev&&S.ev.status&&S.ev.status.type.state==='in'); timer=setTimeout(load, document.hidden?120e3:(live?30e3:300e3));",
    "var g=S.ev?golfNow(S.ev):{}, live=S.cup?points(S.cup).live:g.live, wk=!S.cup&&g.text&&!/^(Final|Canceled|Postponed)$/.test(g.text); timer=setTimeout(load, document.hidden?120e3:(live?30e3:wk?60e3:300e3)); /* v9: between rounds, look every minute for the first tee */");
fs.writeFileSync(P,h);
