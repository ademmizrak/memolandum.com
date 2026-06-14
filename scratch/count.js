const fs = require('fs');
let lines = fs.readFileSync('D:/000Memorade/000Memorade/scratch/extracted.jsx', 'utf8').split('\n');
let start = lines.findIndex(l => l.includes("activeTab === 'home' &&"));
let end = lines.findIndex(l => l.includes('SCIENCE TAB'));
let content = lines.slice(start, end).join('\n');
let openDivs = (content.match(/<div/g) || []).length;
let closeDivs = (content.match(/<\/div>/g) || []).length;
console.log('Home open divs:', openDivs, 'close divs:', closeDivs);
