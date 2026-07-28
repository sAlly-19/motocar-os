const fs = require('fs');
const c = fs.readFileSync('src/theme/themes.ts', 'utf8');
const lines = c.split('\n');
let current = '';
let count = 0;

for (const line of lines) {
  const t = line.trim();
  if (t === 'light:' || t === 'dark:' || t === 'amoled:' || t === 'midnight:') {
    if (current) console.log(current + ':', count);
    current = t.replace(':', '');
    count = 0;
    continue;
  }
  if (current && t === '},') {
    console.log(current + ':', count);
    current = '';
    count = 0;
    continue;
  }
  if (current && t.includes(':') && t.length > 0) {
    count++;
  }
}
