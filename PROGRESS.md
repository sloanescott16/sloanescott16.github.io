# PROGRESS - Live split: Live and Schedule (job 1010-1240-nml)

Branch live-split in worktree hub-split, from origin/main 48cc4d4 (Live v11). Not pushed, not merged.
Old v11 golf progress kept in _notes/live-golf-progress.md.

## Stage 1 - split
- live/index.html: the classic in-progress scoreboard, restored from Live v8 at 1f7344b (the last Live before the day grid;
  it already holds 693d436, the list-row ellipsis), plus the classic Stars logo hunk from 7329d22. Marked Live v13.
- schedule/index.html: the day grid (Live v11) moved here, with its pictures in schedule/img. Marked Schedule v1, heading "Schedule".
  live/img kept as it was (nothing removed).
- Landing (Press Box v34): Live, Schedule and Players pills, side by side in one row.

## Stage 2 - Schedule on the phone
- Phone (board under 560 px): every sport shares the width, hours 40 px wide, so nothing scrolls sideways.
- Cards as tall as their text (52 px), 1 to 3 lanes a sport as the width allows, the rest behind "+N".
- An hour with a game starting in it (or now) is 40 px; empty hours fold to 16 px. Slim header, network left to the game sheet.
- Desktop untouched.

## Stage 3 - checks
- _tests/live-daygrid/test-page.js now opens /schedule/ and also asserts no sideways board scroll on the phone: 274/277.
  The 3 fails are the Baycurrent "waits for 9:35 PM tee" check, which reads the real clock against 9 Oct feeds; the same 3 fail on origin/main.
- _tests/live-split/measure.js (split check plus width and height numbers): 44/44.
- golfNow 27/27 (now compares schedule/index.html), publish-v9 smoke 24/24.
- Handoff: _notes/live-split-handoff.md
