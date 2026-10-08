# Player detail job (branch player-detail)

Started 2026-10-08. Cap 60 minutes.

- [x] Survey: landing tiles and live cards show teams only, no player names. the-green has a player panel (hole by hole). the-pitch has a player card (overview plus bio).
- [ ] Probe ESPN athlete endpoints per sport
- [ ] Shared player view (pb-player.js) plus standalone page player/
- [ ] Wire into the-green, the-pitch, live
- [ ] Verify against live endpoints

## Endpoint survey (2026-10-08, all CORS *, keyless)
Base: site.web.api.espn.com/apis/common/v3/sports/<sport>/<league>/athletes/<id>
- (base): bio for every sport (headshot, age, DOB, birthplace, height, weight, position, team, college, draft, experience, turnedPro for golf).
- /overview: season table (Regular Season, Career rows for team sports; Majors, PGA Tour for golf; per competition for soccer), recent games (gameLog), awards for NFL, NBA, NHL, MLB. Golf: recentTournaments, seasonRankings.
- /stats: career by season per category for NFL, CFB, NBA, NHL, MLB. 404/500 for golf and soccer.
- /bio: awards and teamHistory (team sports, soccer teamHistory only). Empty for golf.
- Golf and soccer career by season: sports.core.api.espn.com/v2/sports/<golf|soccer>/athletes/<id>/statisticslog, then each season's statistics ref.
- Search: site.web.api.espn.com/apis/search/v2?query=..&type=player.
