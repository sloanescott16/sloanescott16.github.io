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
