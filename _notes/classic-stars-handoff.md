# HANDOFF - classic-stars (job 1009-1116-ne2)

What: the Dallas Stars (NHL only) show the classic 1994-2013 logo (NHL logo CDN, local copy in img/, source in img/STARS-LOGO-SOURCE.md).
Where: live/index.html norm() (NHL id 9 or an ESPN NHL dal.png), pb-player.js fixLogo() on the team line, opponent logos and Teams list (also at draw time, so cached data is covered). The landing page Stars tile already had the classic mark and is unchanged.
Run: serve the folder over http, open live/ and player/?s=nhl&id=5161 (Matt Duchene).
Test: Stars logo is the classic mark; Cowboys, Mavericks and other NHL teams unchanged. preview/before-* and preview/after-*.
Unsure: no Stars game on 9 Oct, so Live was checked in the page with sample data, not on a real Stars game. The live-daygrid branch (hub-daygrid) also edits live/index.html; expect a small merge in norm(). Not pushed or merged.
