# Live day grid (job 1009-1111-4we), branch live-daygrid

- 11:13 Started. Worktree made from main 1f7344b. Read live/index.html and the landing page.
- 11:20 Stage 1: copied the landing tiles' picture icons into live/img (mlb Pope, nhl, nba, soccer jumper).
  Finding: the NFL/CFB/MLB/NHL/NBA/Golf/Soccer text chips the Captain means sit on the LANDING tiles (v33 league-look).
- Stage 2: live/index.html v9 day grid written (commit ef06d96).
- Stage 3: page check _tests/live-daygrid/test-page.js, 41/41 pass at 1440 and 390 on real 9 Oct feeds and a busy
  Saturday (10 Oct feeds, clock held at 3:30 PM). Tweaks: compact 40 px blocks, labels top aligned, names stay in view
  when a game began off to the left, grid measured while shown. Progress note moved into _notes so a merge does not
  collide with the untracked PROGRESS.md in hub.
- Done. Landing page untouched (see handoff).
- Fix round 2 (check FAILED on the CFB row): keep() now applies to live games too; each sport row keeps at most 3 lanes
  (his teams, live, rivalry, ranked get lanes first) and the rest sit behind a "+N more" chip under the sport picture,
  which opens the full list in the sheet (tap a game for its card). PC squeezes the whole day into 1440 px, no sideways
  scroll (every other hour named when squeezed). Phone opens at now, or at the first game if nothing is on yet.
  Page check 57/57 at 1440 and 390, today and busy Saturday; busy Saturday grid ends at 784 of 900 px at 1440.
  Screenshots refreshed in preview, plus live-v9-*-more.png. Note: one stray stdin python was started by mistake and
  stopped at once (two processes, killed by id).
