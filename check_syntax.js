const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('d:/000Memorade/index.html', 'utf8');
const scriptStart = code.indexOf('<script type="text/babel">') + '<script type="text/babel">'.length;
const scriptEnd = code.indexOf('</script>', scriptStart);
const scriptContent = code.substring(scriptStart, scriptEnd);

try {
  acorn.Parser.extend(jsx()).parse(scriptContent, { sourceType: 'module', ecmaVersion: 2020 });
  console.log('OK - No Syntax Errors');
} catch(e) {
  console.error('Syntax error:', e.message);
  console.error('Line:', e.loc.line, 'Column:', e.loc.column);
}
