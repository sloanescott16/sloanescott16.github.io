# HANDOFF - Live split: Live and Schedule (job 1010-1240-nml)

Branch live-split in worktree builds\press-box\hub-split, from origin/main 48cc4d4. Not pushed, not merged.

What it is
- /live/ is the classic in-progress scoreboard again (Live v13): live games as cards by league, then Later today and Finals today.
  Source: live/index.html at 1f7344b (Live v8, the last Live before the day grid, which already carries 693d436's ellipsis fix),
  plus the classic Stars logo lines from 7329d22. No other changes to its design.
- /schedule/ is the by-time day grid (Schedule v1 = Live v11 plus the phone layout below).
- Landing (Press Box v34): Live, Schedule, Players pills in one row.
- sw.js is pass-through and caches nothing, so there is no cache name to bump; left alone.

Phone layout (Schedule, board narrower than 560 px)
- Sports share the width; hours column 40 px; no sideways scroll at 375 or 390.
- Cards 52 px tall (text height), not run length. Lanes per sport from the width (1 at phone widths with 6 sports), the rest behind "+N".
- Hours with a game starting (or now) 40 px, others fold to 16 px and are named once per run.

Numbers (busy Saturday and today samples), page and board content size
- 375x667 before: page 375x729 (busy 375x679), board 1398x1319 (busy 1234x1319) in 353 px wide.
- 375x667 after: page 375x667, board 357x719 (busy 357x695) in 357 px wide. No sideways scroll.
- 390x844 before: page 390x856, board 1398x1319 in 368 wide. After: page 390x844, board 372x719 (busy 372x695) in 372 wide.
- 1440x900: unchanged, board 1374x1097, page 1440x924 (that 24 px page scroll was there before too).

How to test (Edge, one reused profile)
- CHROME="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" PW_PROFILE=<worktree>/.browser-profile
- bun _tests/live-split/measure.js after       44/44, log in _tests/live-split/run-split.log
- bun _tests/live-daygrid/test-page.js         274/277, 3 clock-bound golf fails also on origin/main
- bun _tests/golf-live/test-golfnow.js         27/27
- bun _tests/publish-v9/smoke.js               24/24 (real network feeds)
- The shim now honours PW_PROFILE: one profile folder reused, never removed. Without it, the old temp-profile behaviour.
Screenshots: preview/split-before-*, preview/split-after-* (landing, live, schedule at 375, 390, 1440), preview/schedule-v1-*.

Unsure
- On the phone a sport shows one lane, so busy sports lean on "+N" (CFB +15 on busy Saturday). Cards no longer show run length.
- Live status text can still clip at 375 (for example "2nd 8:1..."), fine at 390.
- The classic Live page has no golf (it never did).
- The pending golf branch live-golf (Live v12, 643c581) edits live/index.html, which here is the classic page. Merging it
  conflicts in live/index.html, test-page.js and run-page.log; its changes belong in schedule/index.html instead. Version
  marks: this branch uses Live v13 so as not to clash with that Live v12.
