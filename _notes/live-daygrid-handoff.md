# Live v9, the day grid (job 1009-1111-4we), branch live-daygrid

## What changed
- live/index.html: the live cards, "Later today" and "Finals today" lists are replaced by one grid. One row per sport
  (NFL Cowboys star, CFB Double T, Pope for MLB, Stars, Mavericks, the soccer jumper), a small league chip under each
  picture, the Central day's hours across, each game a block as long as a game usually runs (NFL 3h15, CFB 3h30, MLB 3h,
  NHL and NBA 2h30, soccer 1h55; a live game stretches to now). Live blocks red with a pulsing dot, his teams get a light
  ring, rivalry games a violet edge and the rivalry name, soccer blocks carry their league mark. Red line and time label
  at now. A line above: live, still to come, final.
- Tap a block: a sheet with the full old card (scores, situation, players with the player sheet, rivalry) and a Game
  center link. Escape, the cross or the backdrop closes it. It refreshes with the feed while open.
- Sports with no games today get no row. A day with nothing shows "No games today".
- The day runs to 6 AM, so late games stay on past midnight.
- 11 PM to midnight Central games: from noon on, tomorrow's ESPN board is read once a minute and its games still on
  today's Central date are kept. Tested with a made-up 11:15 PM game.
- Picture icons copied from the landing tiles into live/img (mlb, nhl, nba, soc .webp).

## Phone
The hours scroll sideways under pinned pictures; the grid opens with now about a third of the way in, and stays where
he leaves it once he scrolls. The page itself never scrolls sideways.

## Run the check
bun _tests/live-daygrid/test-page.js   (feeds from _tests/live-daygrid/samples, saved with grab.sh; log run-page.log)
Screenshots: preview/live-v9-*.png

## Unsure
- The Captain's words read as if the NFL/CFB/MLB/NHL text chips should go from the LANDING tiles (v33 league-look) and
  stay on Live. The brief said change Live only, so the landing page is untouched and Live keeps small chips under the
  pictures. Either is a one-line CSS change.
- A busy college Saturday makes the CFB row tall (one lane per game on at once, up to about 20).
- Game lengths are estimates; ESPN gives no end time.

## Fix round 2
- Live college games go through the same filter as the rest (his teams, ranked, rivalry, Big 12 country).
- A sport row has at most 3 lanes. His games, live games, rivalries and ranked games get lanes first; the rest sit behind
  "+N more" under the sport picture, which opens the sport's full list for the day. Tap a row there for its card.
- PC: the whole day fits the width at 1440 px, no sideways scroll. Busy Saturday: all 5 sports fit, grid ends at 784 px.
- Phone: opens at now, or at the first game still to come if nothing is on yet.
- Check: 57/57 (bun _tests/live-daygrid/test-page.js). New screenshots: preview/live-v9-*-more.png.
- Unsure: today's NHL also overflows (4 games at 6 PM, one behind "+1 more"). The cap is MAXL in render() if he wants 4.
