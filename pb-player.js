/* Press Box shared player view (players v1, 2026-10-08).
   One file used by every page: the landing page, Live, The Green, The Pitch and the player page.
   Data: ESPN's public, keyless feeds, called straight from the browser.
     site.web.api.espn.com/apis/common/v3/sports/<sport>/<league>/athletes/<id>            bio, every sport
       .../overview   this season, recent games, awards (team sports), recent tournaments (golf)
       .../stats      career by season (NFL, college football, NBA, NHL, MLB)
       .../bio        awards and team history
     sports.core.api.espn.com/v2/sports/<golf|soccer>/athletes/<id>/statisticslog   career by season for golf and soccer
   Use:
     PBPlayer.open(sport, id, name)          the full player sheet over the page
     PBPlayer.mount(el, sport, id, opts)     the same view inside an element (opts.parts picks sections)
     any element with data-pbp="sport:id"    opens the sheet on tap, even inside a link
   sport is a short key (nfl, cfb, nba, wnba, nhl, mlb, golf, lpga, soc) or an ESPN "sport/league" path.
   Caching: fetches use the browser's normal HTTP cache (ESPN sends max-age), and the built player is kept
   in memory and in localStorage for 30 minutes, so the pass-through service worker never needs to change. */
(function () {
  "use strict";
  if (window.PBPlayer) return;
  var WEB = "https://site.web.api.espn.com/apis/common/v3/sports/";
  var CORE = "https://sports.core.api.espn.com/v2/sports/";
  var SPORTS = {
    nfl: { path: "football/nfl", label: "NFL" },
    cfb: { path: "football/college-football", label: "College football" },
    nba: { path: "basketball/nba", label: "NBA" },
    wnba: { path: "basketball/wnba", label: "WNBA" },
    nhl: { path: "hockey/nhl", label: "NHL" },
    mlb: { path: "baseball/mlb", label: "MLB" },
    golf: { path: "golf/pga", label: "Golf", golf: true },
    lpga: { path: "golf/lpga", label: "LPGA", golf: true },
    soc: { path: "soccer/all", label: "Soccer", soc: true }
  };
  var TTL = 30 * 60e3, mem = {}, inflight = {};
  var SOCLG = { "eng.1": "Premier League", "esp.1": "LALIGA", "ita.1": "Serie A", "ger.1": "Bundesliga", "fra.1": "Ligue 1", "usa.1": "MLS",
    "uefa.champions": "Champions League", "uefa.europa": "Europa League", "uefa.europa.conf": "Conference League", "eng.fa": "FA Cup",
    "eng.league_cup": "League Cup", "esp.copa_del_rey": "Copa del Rey", "fifa.world": "World Cup", "fifa.friendly": "Friendly",
    "uefa.nations": "Nations League", "concacaf.nations.league": "Concacaf Nations League", "concacaf.gold": "Gold Cup",
    "fifa.worldq.concacaf": "WC qualifying", "fifa.worldq.uefa": "WC qualifying", "uefa.euro": "Euros", "conmebol.america": "Copa America",
    "eng.2": "Championship", "ned.1": "Eredivisie", "por.1": "Primeira Liga", "sco.1": "Scottish Prem", "mex.1": "Liga MX",
    "uefa.super_cup": "UEFA Super Cup", "esp.super_cup": "Supercopa", "eng.charity": "Community Shield", "fifa.cwc": "Club World Cup",
    "usa.open": "US Open Cup", "concacaf.champions": "Concacaf Champions Cup", "campeones.cup": "Campeones Cup", "usa.leagues_cup": "Leagues Cup" };

  function sp(s) {
    s = String(s || "");
    if (SPORTS[s]) return Object.assign({ key: s }, SPORTS[s]);
    for (var k in SPORTS) if (SPORTS[k].path === s) return Object.assign({ key: k }, SPORTS[k]);
    var p = s.split("/");
    return { key: s, path: s, label: (p[1] || p[0] || "").toUpperCase(), golf: p[0] === "golf", soc: p[0] === "soccer" };
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function https(u) { return String(u || "").replace(/^http:/, "https:"); }
  function get(u) {
    u = https(u);
    if (inflight[u]) return inflight[u];
    var p = fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    inflight[u] = p; p.then(function () { delete inflight[u]; }, function () { delete inflight[u]; });
    return p;
  }
  function soft(u) { return get(u).catch(function () { return null; }); }
  function lsGet(k) { try { var v = JSON.parse(localStorage.getItem("pbp:" + k) || "null"); return v && Date.now() - v.t < TTL ? v.d : null; } catch (e) { return null; } }
  function lsSet(k, d) {
    try { localStorage.setItem("pbp:" + k, JSON.stringify({ t: Date.now(), d: d })); }
    catch (e) { try { Object.keys(localStorage).filter(function (x) { return x.indexOf("pbp:") === 0; }).forEach(function (x) { localStorage.removeItem(x); }); } catch (e2) {} }
  }
  function yr(ref) { var m = String(ref || "").match(/seasons\/(\d{4})/); return m ? +m[1] : 0; }
  function lgOf(ref) { var m = String(ref || "").match(/leagues\/([^/]+)\//); return m ? m[1] : ""; }
  function short(d) { var t = new Date(d); return isNaN(t) ? "" : t.toLocaleDateString([], { month: "short", day: "numeric" }); }

  /* ---------- build one player's model from the feeds ---------- */
  function bioOf(a, S) {
    var t = a.team || {}, inj = (a.injuries || [])[0], col = a.college || a.collegeTeam || {};
    var hs = (a.headshot && a.headshot.href) || "";
    return {
      id: String(a.id || ""), name: a.displayName || a.fullName || "", first: a.firstName || "", last: a.lastName || "",
      hs: hs, team: t.displayName || "", teamLogo: (t.logos && t.logos[0] && t.logos[0].href) || t.logo || "", teamColor: t.color || "",
      pos: (a.position && (a.position.displayName || a.position.name)) || "", jersey: a.displayJersey || (a.jersey ? "#" + a.jersey : ""),
      age: a.age || "", dob: a.displayDOB || "", birth: String(a.displayBirthPlace || "").replace(/\s+/g, " ").trim() || (a.birthPlace && [a.birthPlace.city, a.birthPlace.state, a.birthPlace.country].filter(Boolean).join(", ")) || "",
      ht: a.displayHeight || "", wt: a.displayWeight || "", college: col.name || col.displayName || col.shortName || "",
      draft: a.displayDraft || "", exp: a.displayExperience || "", debut: a.debutYear || "", turnedPro: a.turnedPro || "",
      bt: a.displayBatsThrows || "", hand: a.hand ? (a.hand.displayValue || a.hand.abbreviation || "") : "",
      nat: a.citizenship || (a.citizenshipCountry && a.citizenshipCountry.displayName) || "", flag: (a.flag && a.flag.href) || "",
      status: (a.status && a.status.name) || "", active: a.active !== false,
      inj: inj ? [inj.status, inj.details && inj.details.type, inj.type && inj.type.description].filter(Boolean).filter(function (x, i, l) { return l.indexOf(x) === i; }).join(", ") : "",
      sum: a.statsSummary && (a.statsSummary.statistics || []).length ? { n: a.statsSummary.displayName || "", st: (a.statsSummary.statistics || []).map(function (x) { return [x.shortDisplayName || x.abbreviation || x.displayName, x.displayValue, x.rankDisplayValue || ""]; }) } : null,
      espn: ((a.links || []).filter(function (l) { return (l.rel || []).indexOf("playercard") >= 0; })[0] || {}).href || ""
    };
  }
  function tableOf(st) {                       // overview.statistics: labels plus splits
    if (!st || !st.labels || !(st.splits || []).length) return null;
    return { n: st.displayName || "", lab: st.labels, dn: st.displayNames || st.names || [], rows: st.splits.filter(function (s) { return !/projected/i.test(s.displayName || ""); }).map(function (s) { return { n: s.displayName || "", s: s.stats || [] }; }) };
  }
  function recentOf(gl) {                      // overview.gameLog
    if (!gl || !gl.statistics || !gl.events) return null;
    var cats = gl.statistics.filter(function (c) { return (c.events || []).length; });
    if (!cats.length) return null;
    var c0 = cats[0], lab = (c0.labels || []).slice(0, 7);
    var rows = (c0.events || []).map(function (e) {
      var ev = gl.events[e.eventId] || {}, o = ev.opponent || {};
      return { id: e.eventId, d: ev.gameDate || "", at: ev.atVs || "", opp: o.abbreviation || o.displayName || "", oppLogo: o.logo || "", res: ev.gameResult || "", sc: ev.score || "", s: (e.stats || []).slice(0, 7) };
    });
    return { n: gl.displayName || "Recent games", cat: c0.displayName || "", lab: lab, rows: rows };
  }
  function careerOf(st) {                      // /stats: categories by season
    if (!st || !(st.categories || []).length) return null;
    var teams = {}; Object.keys(st.teams || {}).forEach(function (k) { var t = st.teams[k]; teams[k] = t.abbreviation || t.shortDisplayName || t.displayName; teams[String(t.id)] = teams[k]; });
    var cats = st.categories.filter(function (c) { return (c.statistics || []).length; }).map(function (c) {
      var rows = c.statistics.map(function (r) { return { y: (r.season && (r.season.displayName || r.season.year)) || "", t: teams[r.teamSlug] || teams[String(r.teamId)] || "", s: r.stats || [] }; }).reverse();
      return { n: c.displayName || c.name, lab: c.labels || [], dn: c.displayNames || [], rows: rows, tot: c.totals || null };
    });
    return cats.length ? cats : null;
  }
  function golfCareer(id) {
    return soft(CORE + "golf/athletes/" + id + "/statisticslog").then(function (log) {
      var ents = ((log && log.entries) || []).map(function (e) {
        var s = (e.statistics || []).filter(function (x) { return x.statistics && x.statistics.$ref; })[0];
        return s ? { y: yr(e.season && e.season.$ref), ref: s.statistics.$ref } : null;
      }).filter(Boolean).sort(function (a, b) { return b.y - a.y; }).slice(0, 14);
      if (!ents.length) return null;
      return Promise.all(ents.map(function (e) { return soft(e.ref); })).then(function (rs) {
        var lab = ["Events", "Cuts", "Wins", "Top 10", "Avg", "Earnings"], keys = ["tournamentsPlayed", "cutsMade", "wins", "topTenFinishes", "scoringAverage", "officialAmount"];
        var tot = [0, 0, 0, 0, 0, 0], money = 0, rows = [];
        rs.forEach(function (r, i) {
          if (!r || !r.splits) return; var v = {};
          (r.splits.categories || []).forEach(function (c) { (c.stats || []).forEach(function (x) { if (v[x.name] == null) v[x.name] = x; }); });
          if (!v.tournamentsPlayed || !v.tournamentsPlayed.value) return;
          var s = keys.map(function (k) { var x = v[k] || (k === "officialAmount" ? v.amount : null); return x ? x.displayValue : ""; });
          [0, 1, 2, 3].forEach(function (j) { tot[j] += +(v[keys[j]] && v[keys[j]].value) || 0; });
          money += +((v.officialAmount || v.amount || {}).value) || 0;
          rows.push({ y: String(ents[i].y), t: "", s: s });
        });
        if (!rows.length) return null;
        var t = [String(tot[0]), String(tot[1]), String(tot[2]), String(tot[3]), "", money ? "$" + Math.round(money).toLocaleString("en-US") : ""];
        return [{ n: "PGA Tour by season", lab: lab, dn: ["Tournaments played", "Cuts made", "Wins", "Top 10 finishes", "Scoring average", "Official money"], rows: rows, tot: t, wins: tot[2] }];
      });
    });
  }
  function socCareer(id, teamNames) {
    return soft(CORE + "soccer/athletes/" + id + "/statisticslog").then(function (log) {
      var ents = ((log && log.entries) || []).map(function (e) {
        var s = (e.statistics || []).filter(function (x) { return x.type === "total" && x.statistics && x.statistics.$ref; })[0] || (e.statistics || [])[0];
        if (!s || !s.statistics) return null;
        var tid = ((s.team && s.team.$ref) || "").match(/teams\/(\d+)/);
        return { y: yr(e.season && e.season.$ref), lg: lgOf(e.season && e.season.$ref), tid: tid ? tid[1] : "", ref: s.statistics.$ref };
      }).filter(Boolean).sort(function (a, b) { return b.y - a.y; }).slice(0, 16);
      if (!ents.length) return null;
      return Promise.all(ents.map(function (e) { return soft(e.ref); })).then(function (rs) {
        var rows = [], tot = [0, 0, 0, 0, 0];
        rs.forEach(function (r, i) {
          if (!r || !r.splits) return; var v = {};
          (r.splits.categories || []).forEach(function (c) { (c.stats || []).forEach(function (x) { if (v[x.name] == null) v[x.name] = x.value; }); });
          var app = +v.appearances || 0; if (!app) return;
          var s = [app, +v.totalGoals || 0, +v.goalAssists || 0, +v.yellowCards || 0, +v.redCards || 0];
          s.forEach(function (x, j) { tot[j] += x; });
          var e = ents[i], lgn = SOCLG[e.lg] || e.lg.toUpperCase();
          rows.push({ y: (e.lg.indexOf("usa") === 0 || e.lg.indexOf("fifa") === 0 || e.lg.indexOf("concacaf") === 0) ? String(e.y) : e.y + "-" + String(e.y + 1).slice(2), t: (teamNames[e.tid] ? teamNames[e.tid] + ", " : "") + lgn, s: s.map(String) });
        });
        if (!rows.length) return null;
        return [{ n: "Club and country, recent seasons", lab: ["APP", "G", "A", "YC", "RC"], dn: ["Appearances", "Goals", "Assists", "Yellow cards", "Red cards"], rows: rows, tot: tot.map(String), part: (log.entries || []).length > ents.length }];
      });
    });
  }
  function golfRecent(ov) {
    var rt = (ov && ov.recentTournaments) || [], rows = [];
    rt.forEach(function (g) { (g.eventsStats || []).forEach(function (e) {
      var c = ((e.competitions || [])[0] || {}).competitors || [], me = c[0] || {}, st = me.status || {};
      var tp = (me.stats || []).filter(function (x) { return x.name === "scoreToPar"; })[0];
      rows.push({ id: e.id, d: e.date, n: e.shortName || e.name || "", pos: (st.position && st.position.displayName) || st.displayValue || "", par: (tp && tp.displayValue) || (me.score && me.score.displayValue) || "", cut: /cut/i.test((st.type && st.type.description) || "") });
    }); });
    rows.sort(function (a, b) { return new Date(b.d) - new Date(a.d); });
    return rows.length ? rows.slice(0, 10) : null;
  }
  function build(sport, id) {
    var S = sp(sport), base = WEB + S.path + "/athletes/" + id;
    return Promise.all([soft(base), soft(base + "/overview"), S.golf || S.soc ? Promise.resolve(null) : soft(base + "/stats"), S.golf ? Promise.resolve(null) : soft(base + "/bio")]).then(function (r) {
      var a = r[0] && r[0].athlete, ov = r[1] || {}, bio = r[3] || {};
      if (!a && !r[1]) throw new Error("no player");
      var m = { sport: S.key, label: S.label, golf: !!S.golf, soc: !!S.soc, at: Date.now() };
      m.bio = bioOf(a || { id: id }, S);
      m.season = tableOf(ov.statistics);
      m.recent = S.golf ? null : recentOf(ov.gameLog);
      m.golfRecent = S.golf ? golfRecent(ov) : null;
      m.next = ov.nextGame || ov.nextTournament ? true : false;
      var aw = (bio.awards || ov.awards || []);
      m.awards = aw.map(function (x) { return { n: x.name || x.displayName || "", c: x.displayCount || "", s: (x.seasons || []).join(", ") }; }).filter(function (x) { return x.n; });
      m.teams = (bio.teamHistory || []).map(function (t) { return { id: String(t.id || ""), n: t.displayName || "", logo: t.logo || "", s: t.seasons || "" }; });
      m.ranks = S.golf && ov.seasonRankings ? { n: ov.seasonRankings.displayName || "", c: (ov.seasonRankings.categories || []).map(function (c) { return { n: c.shortDisplayName || c.displayName, v: c.displayValue, r: c.rankDisplayValue || "" }; }) } : null;
      m.career = careerOf(r[2]);
      var names = {}; m.teams.forEach(function (t) { names[t.id] = t.n; });
      var extra = S.golf ? golfCareer(id) : S.soc ? socCareer(id, names) : null;
      return Promise.resolve(extra).then(function (c) { if (c) m.career = c; return m; });
    });
  }
  function load(sport, id) {
    var k = sp(sport).key + ":" + id;
    if (mem[k] && Date.now() - mem[k].at < TTL) return Promise.resolve(mem[k]);
    var c = lsGet(k); if (c) { mem[k] = c; return Promise.resolve(c); }
    if (inflight[k]) return inflight[k];
    var p = build(sport, id).then(function (m) { mem[k] = m; lsSet(k, m); delete inflight[k]; return m; }, function (e) { delete inflight[k]; throw e; });
    inflight[k] = p; return p;
  }
  function cached(sport, id) { var k = sp(sport).key + ":" + id; return mem[k] || lsGet(k); }

  /* ---------- drawing ---------- */
  var ALL = ["head", "bio", "honours", "season", "recent", "career", "teams"];
  function cell(v) { return v === "0" || v === "0.0" || v === "-" || v === "--" || v === "" ? '<span class="z">' + esc(v || "") + "</span>" : esc(v); }
  function table(lab, dn, rows, first, tot) {
    return '<div class="pbp-ts"><table class="pbp-t"><thead><tr><th class="l">' + esc(first) + "</th>" + lab.map(function (l, i) { return '<th title="' + esc(dn[i] || l) + '">' + esc(l) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.join("") + (tot ? '<tr class="tot"><td class="l">Career</td>' + tot.map(function (v) { return "<td>" + cell(v) + "</td>"; }).join("") + "</tr>" : "") + "</tbody></table></div>";
  }
  function sec(title, body, sub) { return '<section class="pbp-s"><h4>' + esc(title) + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</h4>" + body + "</section>"; }
  function facts(b, m) {
    var f = [];
    function add(k, v) { if (v) f.push('<div><dt>' + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>"); }
    add("Age", b.age ? b.age + (b.dob ? " (born " + b.dob + ")" : "") : b.dob);
    add("Born", b.birth);
    add("Height", b.ht); add("Weight", b.wt);
    add(m.golf ? "Plays" : "Position", m.golf ? (b.hand ? (/^l/i.test(b.hand) ? "Left-handed" : "Right-handed") : "") : b.pos);
    add("Team", b.team);
    add("Nation", m.golf || m.soc ? b.nat : "");
    add("College", b.college);
    add("Draft", b.draft);
    add("Turned pro", b.turnedPro);
    add("Debut", b.debut && !b.draft ? b.debut : "");
    add("Experience", b.exp);
    add("Bats / throws", b.bt);
    add("Shoots", !m.golf && b.hand ? b.hand : "");
    add("Status", b.inj ? b.inj : (!b.active ? "Not active" : ""));
    return f.length ? '<dl class="pbp-f">' + f.join("") + "</dl>" : "";
  }
  function render(m, opts) {
    opts = opts || {};
    var parts = opts.parts || ALL, b = m.bio, out = "";
    var has = function (p) { return parts.indexOf(p) >= 0; };
    if (has("head")) {
      out += '<div class="pbp-h">' + (b.hs ? '<img class="pbp-hs" src="' + esc(b.hs) + '" alt="" onerror="this.remove()">' : '<div class="pbp-hs pbp-ini">' + esc((b.first[0] || "") + (b.last[0] || "")) + "</div>") +
        '<div class="pbp-who"><div class="pbp-k">' + esc([m.label, b.jersey, b.pos].filter(Boolean).join(" · ")) + "</div><h3>" + (b.flag ? '<img class="pbp-fl" src="' + esc(b.flag) + '" alt="">' : "") + esc(b.name) + "</h3>" +
        (b.team ? '<div class="pbp-tm">' + (b.teamLogo ? '<img src="' + esc(b.teamLogo) + '" alt="">' : "") + esc(b.team) + "</div>" : "") + "</div></div>";
    }
    if (has("bio")) out += facts(b, m);
    if (has("honours")) {
      var hon = m.awards.map(function (a) { return '<li><b>' + esc(a.c || "") + "</b> " + esc(a.n) + (a.s ? ' <span class="z">' + esc(a.s) + "</span>" : "") + "</li>"; });
      var c0 = m.golf && m.career && m.career[0];
      if (c0 && c0.wins) hon.unshift("<li><b>" + c0.wins + "</b> PGA Tour wins since " + esc(c0.rows[c0.rows.length - 1].y) + "</li>");
      if (hon.length) out += sec("Honours", '<ul class="pbp-aw">' + hon.join("") + "</ul>");
    }
    if (has("season")) {
      if (m.season) {
        out += sec(m.season.n || "This season", table(m.season.lab, m.season.dn, m.season.rows.map(function (r) { return '<tr><td class="l">' + esc(r.n) + "</td>" + r.s.map(function (v) { return "<td>" + cell(v) + "</td>"; }).join("") + "</tr>"; }), ""));
      } else if (b.sum) {
        out += sec(b.sum.n || "This season", '<div class="pbp-chips">' + b.sum.st.map(function (x) { return "<span><small>" + esc(x[0]) + "</small><b>" + esc(x[1]) + "</b>" + (x[2] ? "<i>" + esc(x[2]) + "</i>" : "") + "</span>"; }).join("") + "</div>");
      }
      if (m.ranks && m.ranks.c.length) out += sec(m.ranks.n || "Tour rankings", '<div class="pbp-chips">' + m.ranks.c.slice(0, 12).map(function (x) { return "<span><small>" + esc(x.n) + "</small><b>" + esc(x.v) + "</b>" + (x.r ? "<i>" + esc(x.r) + "</i>" : "") + "</span>"; }).join("") + "</div>");
    }
    if (has("recent")) {
      if (m.recent && m.recent.rows.length) {
        var R = m.recent;
        out += sec(R.n, table(R.lab, [], R.rows.map(function (g) {
          return '<tr><td class="l"><span class="pbp-res ' + esc(g.res) + '">' + esc(g.res) + "</span> " + esc(g.sc) + ' <span class="z">' + esc((g.at === "@" ? "at " : "v ") + g.opp) + " · " + esc(short(g.d)) + "</span></td>" + g.s.map(function (v) { return "<td>" + cell(v) + "</td>"; }).join("") + "</tr>";
        }), "Game"), R.cat);
      }
      if (m.golfRecent) {
        out += sec("Recent tournaments", '<div class="pbp-ts"><table class="pbp-t"><thead><tr><th class="l">Tournament</th><th>Pos</th><th>To par</th></tr></thead><tbody>' + m.golfRecent.map(function (g) {
          return '<tr><td class="l">' + esc(g.n) + ' <span class="z">' + esc(short(g.d)) + "</span></td><td>" + (g.pos === "1" ? '<b class="pbp-win">Won</b>' : esc(g.pos || "")) + "</td><td>" + esc(g.par) + "</td></tr>";
        }).join("") + "</tbody></table></div>");
      }
    }
    if (has("career")) {
      if (m.career) {
        out += sec("Career", m.career.map(function (c, i) {
          return '<details class="pbp-cat"' + (i === 0 ? " open" : "") + "><summary>" + esc(c.n) + ' <span class="z">' + c.rows.length + " season" + (c.rows.length === 1 ? "" : "s") + "</span></summary>" +
            table(c.lab, c.dn, c.rows.map(function (r) { return '<tr><td class="l">' + esc(r.y) + (r.t ? ' <span class="z">' + esc(r.t) + "</span>" : "") + "</td>" + r.s.map(function (v) { return "<td>" + cell(v) + "</td>"; }).join("") + "</tr>"; }), "Season", c.tot) +
            (c.part ? '<p class="pbp-note">Most recent seasons shown. The full record is on ESPN.</p>' : "") + "</details>";
        }).join(""), m.golf ? "" : "by season");
      } else if (m.sport !== "loading") {
        out += sec("Career", '<p class="pbp-note">ESPN has no season by season record for this player.</p>');
      }
    }
    if (has("teams") && m.teams.length) {
      out += sec("Teams", '<ul class="pbp-teams">' + m.teams.map(function (t) { return "<li>" + (t.logo ? '<img src="' + esc(t.logo) + '" alt="">' : "") + "<span>" + esc(t.n) + '</span><span class="z">' + esc(String(t.s).replace("-CURRENT", " to now")) + "</span></li>"; }).join("") + "</ul>");
    }
    if (opts.link !== false && b.espn) out += '<p class="pbp-src"><a href="' + esc(b.espn) + '" target="_blank" rel="noopener">Full player card on ESPN</a></p>';
    return '<div class="pbp">' + out + "</div>";
  }

  /* ---------- styles, injected once ---------- */
  var CSS = ".pbp{--pbp-ink:#e8eef8;--pbp-dim:#8a98b3;--pbp-line:rgba(255,255,255,.12);--pbp-card:rgba(255,255,255,.04);color:var(--pbp-ink);font:14px/1.4 Inter,system-ui,-apple-system,sans-serif;text-align:left}" +
    ".pbp .z{color:var(--pbp-dim);font-weight:400}" +
    ".pbp-h{display:flex;gap:14px;align-items:center;margin-bottom:12px}.pbp-hs{width:84px;height:84px;border-radius:50%;object-fit:cover;object-position:top;background:var(--pbp-card);border:1px solid var(--pbp-line);flex:none}" +
    ".pbp-ini{display:grid;place-items:center;font:700 26px Oswald,sans-serif;color:var(--pbp-dim)}" +
    ".pbp-who{min-width:0}.pbp-k{font:500 11px Oswald,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--pbp-dim)}" +
    ".pbp-who h3{font:700 24px/1.15 Oswald,sans-serif;letter-spacing:.03em;margin:2px 0}.pbp-fl{height:.7em;margin-right:8px;vertical-align:baseline;border-radius:2px}" +
    ".pbp-tm{display:flex;align-items:center;gap:6px;color:var(--pbp-dim);font-size:13px}.pbp-tm img{width:20px;height:20px;object-fit:contain}" +
    ".pbp-f{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px 12px;margin:0 0 6px;padding:10px 12px;border-radius:12px;background:var(--pbp-card)}" +
    ".pbp-f dt{font-size:11px;color:var(--pbp-dim);text-transform:uppercase;letter-spacing:.08em}.pbp-f dd{margin:0;font-weight:600}" +
    ".pbp-s{margin-top:14px}.pbp-s h4{font:700 14px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase;margin:0 0 6px;display:flex;gap:8px;align-items:baseline}" +
    ".pbp-s h4 small{font:400 12px Inter,sans-serif;letter-spacing:0;text-transform:none;color:var(--pbp-dim)}" +
    ".pbp-ts{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:10px;border:1px solid var(--pbp-line)}" +
    ".pbp-t{border-collapse:collapse;width:100%;font-size:13px;font-variant-numeric:tabular-nums}.pbp-t th,.pbp-t td{padding:6px 8px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--pbp-line)}" +
    ".pbp-t th{font:500 11px Oswald,sans-serif;letter-spacing:.08em;color:var(--pbp-dim);position:sticky;top:0}.pbp-t .l{text-align:left;position:sticky;left:0;background:var(--pbp-bg,#121a2b);z-index:1}" +
    ".pbp-t tr:last-child td{border-bottom:0}.pbp-t tr.tot td{font-weight:700;border-top:2px solid var(--pbp-line)}" +
    ".pbp-res{display:inline-block;min-width:16px;font-weight:700}.pbp-res.W{color:#22c55e}.pbp-res.L{color:#ef4444}.pbp-res.T,.pbp-res.D{color:#eab308}.pbp-win{color:#eab308}" +
    ".pbp-cat{margin-bottom:8px}.pbp-cat summary{cursor:pointer;padding:6px 2px;font-weight:600;list-style-position:inside}" +
    ".pbp-chips{display:flex;flex-wrap:wrap;gap:6px}.pbp-chips span{display:flex;flex-direction:column;padding:6px 10px;border-radius:10px;background:var(--pbp-card);min-width:84px}" +
    ".pbp-chips small{font-size:11px;color:var(--pbp-dim)}.pbp-chips b{font-size:16px}.pbp-chips i{font-style:normal;font-size:11px;color:var(--pbp-dim)}" +
    ".pbp-aw{list-style:none;padding:0;margin:0;display:grid;gap:4px}.pbp-aw li{padding:6px 10px;border-radius:8px;background:var(--pbp-card)}.pbp-aw b{color:#eab308;margin-right:4px}" +
    ".pbp-teams{list-style:none;padding:0;margin:0;display:grid;gap:4px}.pbp-teams li{display:flex;gap:8px;align-items:center;padding:4px 2px}.pbp-teams img{width:22px;height:22px;object-fit:contain}.pbp-teams .z{margin-left:auto}" +
    ".pbp-note{color:var(--pbp-dim);font-size:13px;margin:6px 0}.pbp-src{margin-top:16px;font-size:13px}.pbp-src a{color:#60a5fa;text-decoration:underline}" +
    ".pbp-load{color:var(--pbp-dim);padding:18px 0}" +
    "#pbpSheet{position:fixed;inset:0;z-index:2147483000;display:none}#pbpSheet.on{display:block}" +
    "#pbpSheet .pbp-bd{position:absolute;inset:0;background:rgba(0,0,0,.6)}" +
    "#pbpSheet .pbp-box{position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:min(760px,100%);max-height:92dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;" +
    "background:#0f1626;--pbp-bg:#0f1626;border:1px solid rgba(255,255,255,.12);border-radius:18px 18px 0 0;padding:18px 16px calc(22px + env(safe-area-inset-bottom))}" +
    "@media (min-width:800px){#pbpSheet .pbp-box{top:4vh;bottom:auto;border-radius:18px;max-height:92vh}}" +
    "#pbpSheet .pbp-x{position:sticky;top:0;float:right;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:#1b2438;color:#e8eef8;font-size:22px;line-height:1;cursor:pointer;z-index:3}" +
    "body.pbp-lock{overflow:hidden}[data-pbp]{cursor:pointer}";
  function css() { if (document.getElementById("pbpCss")) return; var s = document.createElement("style"); s.id = "pbpCss"; s.textContent = CSS; document.head.appendChild(s); }

  /* ---------- inline and sheet ---------- */
  var seq = 0;
  function mount(el, sport, id, opts) {
    if (!el || !id) return;
    css(); var my = ++seq; el.setAttribute("data-pbp-seq", my);
    var c = cached(sport, id);
    if (c) { el.innerHTML = render(c, opts); return Promise.resolve(c); }
    el.innerHTML = '<div class="pbp"><div class="pbp-load">' + esc((opts && opts.loading) || "Loading the player's career…") + "</div></div>";
    return load(sport, id).then(function (m) { if (el.getAttribute("data-pbp-seq") == my) el.innerHTML = render(m, opts); return m; },
      function () { if (el.getAttribute("data-pbp-seq") == my) el.innerHTML = '<div class="pbp"><p class="pbp-note">ESPN has no player card for this player right now.</p></div>'; });
  }
  var sheet = null, pushed = false;
  function close() {
    if (!sheet || !sheet.classList.contains("on")) return;
    sheet.classList.remove("on"); document.body.classList.remove("pbp-lock");
    if (pushed) { pushed = false; try { history.back(); } catch (e) {} }
  }
  function open(sport, id, name) {
    if (!id) return; css();
    if (!sheet) {
      sheet = document.createElement("div"); sheet.id = "pbpSheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
      sheet.innerHTML = '<div class="pbp-bd"></div><div class="pbp-box"><button class="pbp-x" aria-label="Close">×</button><div class="pbp-in"></div></div>';
      document.body.appendChild(sheet);
      sheet.addEventListener("click", function (e) { if (e.target.closest(".pbp-x") || e.target.classList.contains("pbp-bd")) close(); });
    }
    var inn = sheet.querySelector(".pbp-in");
    sheet.querySelector(".pbp-box").scrollTop = 0;
    sheet.classList.add("on"); document.body.classList.add("pbp-lock");
    if (!pushed) { try { history.pushState(Object.assign({}, history.state || {}, { pbp: 1 }), "", location.href); pushed = true; } catch (e) {} }
    mount(inn, sport, id, { loading: "Loading " + (name || "the player") + "…" });
  }
  window.addEventListener("popstate", function () { if (pushed && sheet && sheet.classList.contains("on")) { pushed = false; sheet.classList.remove("on"); document.body.classList.remove("pbp-lock"); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  // any data-pbp="sport:id" opens the sheet, even inside a link or a card that opens something else
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest("[data-pbp]"); if (!t) return;
    var v = t.getAttribute("data-pbp"), i = v.lastIndexOf(":"); if (i < 1) return;
    e.preventDefault(); e.stopPropagation();
    open(v.slice(0, i), v.slice(i + 1), t.getAttribute("data-pbp-name") || t.textContent);
  }, true);

  /* ---------- search, for the player page ---------- */
  var LG2KEY = { "football/nfl": "nfl", "football/college-football": "cfb", "basketball/nba": "nba", "basketball/wnba": "wnba", "hockey/nhl": "nhl", "baseball/mlb": "mlb" };
  function search(q) {
    q = String(q || "").trim(); if (q.length < 2) return Promise.resolve([]);
    return get("https://site.web.api.espn.com/apis/search/v2?query=" + encodeURIComponent(q) + "&limit=12&type=player").then(function (d) {
      var res = ((d && d.results) || []).filter(function (r) { return r.type === "player"; })[0];
      return ((res && res.contents) || []).map(function (c) {
        var m = String(c.uid || "").match(/a:(\d+)/), sport = c.sport || "", lg = c.defaultLeagueSlug || "";
        var key = sport === "golf" ? (lg === "lpga" ? "lpga" : "golf") : sport === "soccer" ? "soc" : LG2KEY[sport + "/" + lg] || (sport && lg ? sport + "/" + lg : "");
        return m && key ? { id: m[1], sport: key, name: c.displayName || "", sub: c.subtitle || c.description || "", img: c.image && c.image.default || "" } : null;
      }).filter(Boolean);
    });
  }

  window.PBPlayer = { open: open, close: close, mount: mount, load: load, render: render, search: search, sport: sp, attr: function (sport, id, name) { return id ? ' data-pbp="' + esc(sport + ":" + id) + '"' + (name ? ' data-pbp-name="' + esc(name) + '"' : "") : ""; } };
})();
