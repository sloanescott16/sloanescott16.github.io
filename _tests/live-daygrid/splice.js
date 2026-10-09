/* One-off: put the v9 day-grid block in place of the old list rendering in live/index.html */
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', '..', 'live', 'index.html'); let s = fs.readFileSync(f, 'utf8');
const a = s.indexOf('function line(g) {'), b = s.indexOf('async function tick() {');
s = s.slice(0, a) + fs.readFileSync(path.join(__dirname, 'newblock.js.txt'), 'utf8') + s.slice(b);
s = s.replace('await Promise.all(want.map(pull).concat([mlbKeys()]));', 'await Promise.all(want.map(l => pull(l, full)).concat([mlbKeys()]));');
fs.writeFileSync(f, s);
