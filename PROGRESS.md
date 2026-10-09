# PROGRESS - classic-stars (job 1009-1116-ne2)

- Stage 1 (done): classic Stars logo saved in img/ from the NHL logo CDN (see img/STARS-LOGO-SOURCE.md).
  Live (live/index.html): NHL Dallas (ESPN id 9) or any ESPN NHL dal.png logo swaps to the classic mark.
  Shared player sheet (pb-player.js): team, opponent and team-history logos that are ESPN NHL dal.png swap too.
  Landing page Stars tile already shows the classic mark (embedded image), left as is.
- Stage 2: before and after screenshots at desktop and phone widths in preview/.
- Stage 1b (done): pb-player.js also swaps at draw time, so player data already cached in a browser (30-minute localStorage cache) shows the classic logo too.
- Stage 2 (done): screenshots in preview/ (headless Chrome over DevTools, live ESPN data, local http server). before-* is main, after-* this branch.
  player: Matt Duchene (ESPN NHL 5161), team line and the Teams list show the classic mark. Desktop 1440x900, phone 390x844.
  live: no Stars game on 9 Oct, so the Live shots show no Stars logo either way. The swap was checked in the page instead:
  norm() gives the classic logo for NHL id 9 and NHL dal.png, and leaves the NFL Cowboys, NBA Mavericks and other NHL teams alone.
