# Golf LIVE only while players are on the course (branch golf-live-oncourse)

State: done, not merged, not pushed. See HANDOFF.md.

## Stage 1 (done): read the code, saved real ESPN samples
- Bug: landing v32 lit the golf tile when the EVENT status was "in". ESPN keeps the event "In Progress"
  all week, overnight too. Real feed 2026-10-08 4:24 PM CT: Baycurrent Classic event "in", competition
  "Round 1 - Play Complete" (state post), every player "pre" with Round 2 tee times. The tile showed LIVE.
- The Green v8 had the same fault in the hero "live" tag and the header pill.
- Live page has no golf. sw.js is pass-through. No shared script file exists.

## Stage 2 (done): golfNow(ev, now) in landing v33 and The Green v9
## Stage 3 (done): logic test 26 of 26, page check in Chrome 52 of 52
## Stage 4 (done): The Green between-rounds hero no longer falls back to "Starts Wednesday, 72 in the field"
