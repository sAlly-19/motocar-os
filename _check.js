const fs = require('fs');
const c = fs.readFileSync('src/theme/themes.ts', 'utf8');
const lines = c.split('\n');
let theme = '';
let count = 0;

for (const line of lines) {
  const trimmed = line.trim();
  
  if (trimmed.startsWith('light:') || trimmed.startsWith('dark:') || 
      trimmed.startsWith('amoled:') || trimmed.startsWith('midnight:')) {
    if (theme) console.log(theme + ': ' + count);
    theme = trimmed.split(':')[0];
    count = 0;
    continue;
  }
  
  if (theme && trimmed === '},') {
    console.log(theme + ': ' + count);
    theme = '';
    count = 0;
    continue;
  }
  
  if (theme && trimmed.length > 0 && trimmed.includes(':')) {
    count++;
  }
}
