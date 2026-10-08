# Golf LIVE only while players are on the course (branch golf-live-oncourse)

## Stage 1 (done): read the code, saved real ESPN samples
- Bug found: landing v32 lights the golf tile when the EVENT status is "in". ESPN keeps the event "In Progress"
  for the whole week, even overnight. Real feed 2026-10-08 16:24 CT: Baycurrent Classic event "in", competition
  "Round 1 - Play Complete" (state post), every player "pre" with Round 2 tee times. The tile showed LIVE.
- The Green v8 has the same fault (strokeModel state = event state first), in the hero "live" tag and the header pill.
- Live page has no golf. sw.js is pass-through. No shared script file exists.
- Real samples saved in _tests/golf-live/samples (PGA play complete, Korn Ferry in progress, PGA final, pre-event).

## Stage 2 (done): golfNow(ev, now) added to landing v33 (tile + quiet pill) and The Green v9 (hero tag, header pill, poll)
## Stage 3: tests against samples, local page check
