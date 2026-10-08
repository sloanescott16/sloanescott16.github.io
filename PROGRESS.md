# league-look progress (not for publishing)

Job: tell the leagues apart at a glance, calmer tiles, Mavs and Cowboys clearly distinct. Branch league-look.

- 16:30 Stage 0: read code. Later Today strip lives on live/index.html (.li rows, coloured left edge per league).
  Landing tiles (index.html) use a 5px coloured top bar and a coloured glow per sport; football is #3b82f6, Mavs #0064b1.
  Before shots taken with real data: shots/before-*.png (not committed).
- 16:35 Stage 1 (8c386fe): Live page. Neutral league chip column on every Later today and Finals row; colour edges and
  section bars neutral; his team's games get one soft light ring in every league. Right column shows the network only
  (it used to fall back to the league name, so "NBA" there meant "no network listed").
- 16:40 Stage 2 (6f7b6ee, then reworked): Press Box landing v35. No coloured top bars or glows; neutral league chip in each
  tile's bottom corner (NFL and CFB on the football halves). Single-tile chips use ::after and the CSS sits in its own
  style tag, so the golf lane (which edits the golf tile line and the end of the main style block) merges cleanly.
  Checked with git merge-tree: index.html and live/index.html merge clean with golf-live-oncourse and player-detail;
  only PROGRESS.md conflicts (every lane has one).

## Handoff
- Run: serve the folder over http (any static server) and open / and /live/. Headless Chrome needs a normal user agent
  or ESPN's edge answers Access Denied, which shows as "no feed" on every league.
- Test: shots/ holds before and after at 1440 and 390 wide with real data (390 shots are a 390px iframe in a 600px
  window, the grey is the harness). after-live-cards-preview-1440.png is a test-only render with every game drawn as a
  live card, to check card styling while nothing was on. Shots are not committed.
- Unsure: no finals were on the board, so a Finals row with a chip was not seen with real data (same markup as Later
  today). Cup chips (a cup one of his sides plays in) use ESPN's abbreviation, cut to five letters, not seen live.
