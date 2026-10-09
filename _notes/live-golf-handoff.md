# HANDOFF - Live v11, golf column (job 1009-1847-a28)

Branch live-golf in worktree hub-golf, from origin/main 161008b (Live v10). Not pushed, not merged.

Why golf was missing: the Live page never read golf. Its feed list (LEAGUES) and column list (SPORTS) held only NFL, CFB,
MLB, NHL, NBA and soccer. The golf live fix of 8 Oct changed only the Press Box tile and The Green.

What changed (live/index.html, plus live/img/golf.webp, the golf tile's picture):
- Reads the PGA, LPGA, LIV, DP World, Champions and Korn Ferry scoreboards once a minute (never on the 5 second fast poll).
- Golf column with picture, "Golf" chip, up to three lanes and "+N more" (lists tournaments). With no golf on the day the
  column stays and its head says "No play today" (if no sport at all has games, the old "No games today" note shows).
- A tournament card runs from the first tee time of the round played that Central day to the last tee time plus five hours
  (cut at midnight). Tee times come from each player's round linescore. No tee times for the day: 8 AM to 1 PM tee times assumed (play to 6 PM),
  and the sheet says "tee times not posted".
- Card: tour chip and short name, leader (T1 when tied) and score, then status and network: "R3 in progress" (red),
  "R3 tees 9:35–11:36 PM", "R2 complete", or "Final". Live uses the shared golfNow (third identical copy) and never before the first tee.
- Tap: sheet with tournament, tour, round, tee window, top five (position, name, country, thru or round score, total), status, network, link to The Green.
- Version meta Live v11.

How to test:
- PW_TMP=<empty folder> bun _tests/live-daygrid/test-page.js : 277/277. Cases: today (real feeds, real clock), busy Saturday
  (also the no-golf fixture), golf (1 PM Friday, Champions and Korn Ferry set in progress, a made-up fourth on LIV, so 3 lanes and +1 more).
- bun _tests/golf-live/test-golfnow.js : 27/27, now also checks the Live copy of golfNow matches.
- Screenshots: preview/live-v11-<pc|phone>-<today|golf|busy>.png, plus -golf-sheet, -golf-more, -more, -sheet, stars.

Unsure:
- The today case runs on the real clock with feeds saved at 18:50 on 9 Oct; its Baycurrent check expects "R3 tees 9:35" so it only holds before 9:35 PM tonight.
- Japan and other overnight events are drawn only to midnight; the night's tail after midnight is not shown.
- Thru is counted from holes in the scoreboard; ESPN's scoreboard can lag the leaderboard feed by a minute or two.
- All golf cards link to The Green home, which follows the PGA Tour; other tours have no page of their own yet.
