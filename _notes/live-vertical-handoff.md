# HANDOFF - Live v10, the day grid turned 90 degrees (job 1009-1827-y89)

Branch live-vertical in worktree hub-vertical, from main 84a5542. Not pushed, not merged.

What changed (live/index.html only):
- One column per sport across the top (picture, chip, "+N more" chip), pinned while the board scrolls.
- Hours run down the board, named on the right-hand side, pinned while the columns scroll sideways.
- Each game is a card in its sport's column, top at its start time, height from the usual run length (live games stretch to now plus 15 minutes). Overlaps sit side by side in up to 3 lanes; the rest go behind "+N more", as before.
- Now is a red line across the board, its time in a red pill in the hours column.
- Opens with now a third of the way down (or at the next game if nothing is on); on a narrow phone it also scrolls sideways to the first sport with a game on. Follows now with a smooth scroll on each refresh, paused for two minutes after he scrolls himself.
- PC: the board fills the window height, the width is shared out by lanes so every sport shows; an hour is 52 to 96 px. Phone: 64 px an hour, 82 px a lane, sideways scroll only when the sports do not fit.
- Kept: live red outline with clock, finals, start time and network, rankings, rivalry badge, summary line, Press Box button, update stamp, classic Stars logo, game sheet on tap.
- Version: meta pb-version "Live v10" and v10 comments.

How to test: PW_TMP=<empty folder> bun _tests/live-daygrid/test-page.js (160/160, log in run-page.log). Today's saved feeds with the real clock, and busy Saturday with the clock held at 3:30 PM Central, at 1440x900, 390x844 and 375x667. Page errors and console.error both fail it.
Screenshots: preview/live-v10-<pc|phone>-<today|busy>.png (plus -more, -sheet and live-v10-stars-*).

Unsure: the now line is drawn over the cards (slightly see-through), as calendar apps do, so it can cross a line of text on a live card. With today's saved feeds the live games are all "Puck drop soon" (past start, feed not flipped), so the clock is shown only in the busy Saturday case.
