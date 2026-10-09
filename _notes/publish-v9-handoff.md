# Handoff - publish-v9

What: main + live-daygrid + classic-stars, plus a phone fix for the clipped "+N more" chip on Live. Live is v9. Landing tiles and the text chips under the Live pictures are unchanged.

Run the checks (from this folder, bun, Chrome already on the PC):
- bun _tests/live-daygrid/test-page.js   (65 checks, saved feeds, busy Saturday with the Stars at Pittsburgh)
- bun _tests/publish-v9/smoke.js         (Landing, Players, The Pitch load with no page errors, 1440 and 390)

Screenshots: preview/publish-stars-grid-*.png, publish-stars-sheet-*.png, publish-landing/players/the-pitch-*.png, and the refreshed live-v9-*.png.

Unsure of:
- Grid cells carry team abbreviations only, no logos, so the classic Stars mark shows in the game sheet and the "+N more" list, not inside the cell itself.
- The Pitch said "could not reach the feed" in the headless run. Its file is identical to main and there were no page errors; the feed is fetched live through the test shim, so this looks like the harness, not the merge.
- PROGRESS.md is now tracked (it came in with classic-stars). The main hub folder has an untracked PROGRESS.md, so merging this into main there will stop on it until that file is set aside.
