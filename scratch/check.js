const babel = require('@babel/core');
const fs = require('fs');

try {
  let html = fs.readFileSync('D:/000Memorade/000Memorade/index.html', 'utf8');
  let start = html.indexOf('<script type="text/babel">') + '<script type="text/babel">'.length;
  let end = html.indexOf('</script>', start);
  let code = html.substring(start, end);
  
  babel.transformSync(code, { presets: ['@babel/preset-react'] });
  console.log('Babel parse OK');
} catch (e) {
  console.error('Babel error:', e.message);
}
