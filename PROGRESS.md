# PROGRESS - Live v11, golf column (job 1009-1847-a28)

Branch live-golf in worktree hub-golf, from origin/main 161008b. Not pushed, not merged.

## Stage 1 (19:00) - cause found
Golf is not on Live because the Live page never had golf. Its LEAGUES list (the feeds it reads) and its SPORTS list
(the columns) hold only NFL, CFB, MLB, NHL, NBA and soccer. Not keep(), not the lane cap, not a rendering fault.
The golf live fix (1f7344b / 7747a5c) changed only the Press Box golf tile and The Green; its handoff says
"The Live page has no golf". There is golf today: Baycurrent Classic R3 (PGA, tees 9:35 PM Central), Open de Espana R2
(DP World, done), Korn Ferry Tour Championship R2 (done), Furyk & Friends R1 (Champions, done).
- live/img/golf.webp: the golf tile's picture, copied out of the landing page by extract-icons.js.
- _tests/live-daygrid/samples/golf-20261009: today's real ESPN golf scoreboards (pga, lpga, liv, eur, champions-tour, ntw).

## Stage 2 - golf column built (Live v11)
- live/index.html: six golf tours read (PGA, LPGA, LIV, DP World, Champions, Korn Ferry), once a minute. Each tournament is
  a card in a Golf column (picture and chip like the others), placed from the first tee time of the round played today to
  the last tee time plus five hours (ESPN gives every player's tee time; if none for today, 8 AM to 6 PM is assumed and said).
  Card: tour chip and name, leader and score, then "R3 in progress" (red, live), "R3 tees 9:35–11:36 PM" or "R2 complete", and
  the network. Live uses the shared golfNow rule (third identical copy, checked by test-golfnow.js) and never before the
  first tee. Up to three lanes, then "+N more" (lists tournaments). Tap: sheet with round, tee window, top five, The Green link.
  No golf today: the column stays, its head says "No play today".
- Checks: test-page.js 277/277 (today real feeds, busy Saturday as the no-golf fixture, golf fixture at 1 PM with rounds
  in progress); test-golfnow.js 27/27.

## Stage 3 - checked and handed off
- Golf sheet card edge made neutral like the others. Checks rerun: 277/277 and 27/27, no console or page errors.
- Handoff: _notes/live-golf-handoff.md. Old v10 progress kept in _notes/live-vertical-progress.md.

## Live v12 - PGA Tour and majors only (2026-10-09)
- The Captain: "only pga tournaments and majors should get that treatment, don't care about other tours".
- live/index.html: only the PGA Tour golf feed is read (LPGA, LIV, DP World, Champions, Korn Ferry feeds removed). golfKeep() keeps an event when its name is a men's major (Masters, PGA Championship, U.S. Open, The Open Championship) or it is on the PGA feed, and drops any name that says another tour, senior, women's or amateur. No PGA event or major: "No play today".
- Tests (_tests/live-daygrid/test-page.js): new cases others (only other tours playing) and major (Masters on the PGA board, live); today and golf prove PGA plus other tours shows only the PGA event, no "+N more", only golf/pga requested; matcher unit check. 440/440, no console or page errors; test-golfnow.js 27/27. Screenshots preview/live-v12-*.png.
- Not pushed or merged. Older preview/live-v11-*.png were re-rendered by an earlier test run and are left uncommitted.
- Fix after check: golfKeep now normalises names (curly quotes, dots, spaces, case, "presented by" tail), drops women, ladies, girls, junior, senior, amateur, champions (not "Tournament of Champions"), LPGA, LIV, DP World, Korn Ferry, and matches majors by whole name only. Matcher check now 27 names. 440/440, golfNow 27/27.
