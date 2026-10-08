# Handoff: golf LIVE only while players are on the course

Branch `golf-live-oncourse` in worktree `hub-golflive`, cut from main e85677d. Not merged, not pushed.

## What changed
- `index.html`, Press Box v33. The golf tile turns red and shows LIVE only while players are on the course.
  Between rounds it shows a quiet grey pill instead, such as "R2 tees off 6:45 PM", "Round 1 complete" or
  "Round 2 suspended". Nothing shows before the week starts or once it is final (as before).
  While a week is under way the tile also asks the ESPN leaderboard feed (same one The Green uses), because the
  scoreboard feed has no per-player status. If that call fails it falls back to the scoreboard verdict.
- `the-green/index.html`, The Green v9. Hero "live" tag, header pill and dot use the same rule. Header pill shows the
  quiet line between rounds. Polls every minute between rounds (was five) so the first tee is picked up soon.
  Also: a round already played counts as "started", so between rounds the hero shows the leader and the round so far
  instead of "Starts Wednesday, 72 in the field" (that happened whenever ESPN rolled players to the next round's tees).
- `live/index.html` and `sw.js`: unchanged. The Live page has no golf; the worker is pass-through.

## How live is decided (golfNow, same code in both pages, between GOLFNOW-START and GOLFNOW-END)
1. Event final, canceled or postponed: not live.
2. Neither the event nor any competition is "in": not live (week not started).
3. A competition (or the event) whose status name, description or detail says suspended, delayed, postponed,
   canceled, halted, weather, rain or darkness: not live, text "Round N suspended" or "Round N delayed".
4. If per-player status is present (stroke play leaderboard feed): live only if at least one player is "in", not
   suspended, and past their tee time. This wins over the competition status, both ways.
5. Otherwise (scoreboard feed, or a cup with many matches): live if a competition is "in" and does not say complete.
6. Not live text: next tee time of a player still "pre" ("R2 tees off 6:45 PM", day added if not today, Central),
   else "Round N complete", else "Between rounds".

## How to test
- `bun _tests/golf-live/test-golfnow.js` : 26 checks against real ESPN samples saved 2026-10-08 in `_tests/golf-live/samples`
  (PGA play complete with R2 tee times, Korn Ferry R1 in progress, PGA final, Presidents Cup final, pre-event,
  European Tour play complete) plus suspended, delayed, rain delay, overnight and early-flip cases made from them.
  Also checks the two copies of golfNow are identical.
- `bun _tests/golf-live/test-page.js` : serves the worktree on localhost, answers every ESPN call from the samples,
  checks the tile (class, badge, red border, quiet pill, fits at 390 wide) and The Green header and hero. 52 checks.
  Screenshots in `_tests/golf-live/shots`. Its tee-time wording assumes it runs before 6:45 PM Central on 2026-10-08.
- `_tests` starts with an underscore, so GitHub Pages (Jekyll) does not publish it.

## Unsure
- No real suspended or delayed feed exists today; those cases use ESPN's usual wording, made from the real feed.
- If ESPN is slow to mark the first group "in" after its tee time, the pill names the next group's tee time for a minute or two.
- The Cup view's own match states (Cup tab, "Live · N") were left as they were; only the shared rule covers cup weeks.
- The test server refuses sw.js: a claimed pass-through worker would carry feed requests past the mocks.
