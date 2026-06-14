const fs = require('fs');
let html = fs.readFileSync('D:/000Memorade/000Memorade/index.html', 'utf8');
let start = html.indexOf('<script type="text/babel">') + '<script type="text/babel">'.length;
let end = html.indexOf('</script>', start);
let code = html.substring(start, end);
fs.writeFileSync('D:/000Memorade/000Memorade/scratch/extracted.jsx', code);
