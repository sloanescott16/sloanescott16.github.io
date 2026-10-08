# Handoff: player detail (branch player-detail, 2026-10-08)

## What was built
- `pb-player.js` (site root): one shared player view for every sport. Bio (headshot, age and birth date, birthplace,
  height, weight, position, team, college, draft, turned pro, experience, bats and throws, shoots, nation, injury),
  honours, this season, recent games (golf: recent tournaments and tour rankings), career by season with career totals,
  and team history. Works as a sheet over any page (`PBPlayer.open`), inline (`PBPlayer.mount`), or from any element with
  `data-pbp="sport:id"`, which also works inside card links (the tap does not follow the link).
- `player/index.html`: new Players page. Search any player ESPN covers, or open one directly with `?s=nfl&id=2577417`.
- `the-green/index.html`: the player panel now shows the shared profile under the hole by hole card. A name outside the
  week's field opens the shared sheet. Version marker not bumped, to avoid clashing with the golf live lane.
- `the-pitch/index.html` v5: the player card adds bio, honours, career by season (club and country) and every club.
- `live/index.html` v9: cards and list rows name the game's leaders (football), scorers (soccer), probable pitchers or
  goalies before the start (MLB, NHL), or each side's leader. Tap opens the sheet. Golf live status code untouched.
- `index.html` v34: a Players pill next to Live.
- Service worker unchanged. Fetches use the normal HTTP cache (ESPN sends max-age) and each built player is kept in
  memory and localStorage for 30 minutes.

## Data sources (all keyless, CORS open)
site.web.api.espn.com common v3 athlete, overview, stats, bio; sports.core.api.espn.com statisticslog for golf and
soccer careers; site.web.api.espn.com search v2.

## How to test
Serve the folder on localhost and open `player/?s=golf&id=9478`, `live/`, `the-green/#board`, `the-pitch/#stats`.
The run used here (scratchpad, not in the repo): bun static server plus the pc-test pw-shim against live ESPN.
Result 35 of 35. Players checked: Scheffler, Prescott, C.J. Stroud, Doncic, Makar, Seager, Sergi Roberto, Haaland,
plus live names from NHL, NFL and MLB.

## Unsure or missing
- Headless Chrome is refused by site.api.espn.com (Akamai, 403). The test passes scoreboard calls through with an
  iPhone user agent. Real phones are not affected, the live site already uses that feed.
- Headshots looked blank in headless screenshots, probably the same CDN refusal. Not confirmed on a phone.
- Golf: no majors count (ESPN has no awards feed for golf); career wins are summed from the seasons ESPN lists.
- College football has no honours feed. Soccer career shows the 16 most recent league seasons.
- ESPN's own birth date string is day first (29/7/1993).
- The golf cup view names (team matches) are not tappable yet.
