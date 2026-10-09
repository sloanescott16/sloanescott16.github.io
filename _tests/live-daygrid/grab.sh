#!/bin/sh
# Saves real ESPN and MLB feeds for a Central date into samples/<date>/ so the page check runs on real data.
# sh _tests/live-daygrid/grab.sh 20261009
D=$1; OUT="$(dirname "$0")/samples/$D"; mkdir -p "$OUT"
for kv in nfl=football/nfl cfb=football/college-football mlb=baseball/mlb nhl=hockey/nhl nba=basketball/nba epl=soccer/eng.1 liga=soccer/esp.1 ucl=soccer/uefa.champions mls=soccer/usa.1 wc=soccer/fifa.world fri=soccer/fifa.friendly cnl=soccer/concacaf.nations.league unl=soccer/uefa.nations; do
  k=${kv%%=*}; p=${kv#*=}; q="?dates=$D"; [ "$k" = cfb ] && q="?groups=80&limit=400&dates=$D"
  curl -s "https://site.api.espn.com/apis/site/v2/sports/$p/scoreboard$q" -o "$OUT/$k.json"
  echo "$k $(grep -o '"uid":"s:[0-9]*~l:[0-9]*~e:' "$OUT/$k.json" | wc -l)"
done
DS=$(echo $D | sed 's/\(....\)\(..\)\(..\)/\1-\2-\3/')
curl -s "https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=$DS&endDate=$DS" -o "$OUT/statsapi.json"
