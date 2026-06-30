const fs = require('fs');
const path = require('path');

const engines = ['breakout', 'invaders', 'shooter', 'wordascent', 'worddrop'];
const enginesDir = path.join(__dirname, 'src', 'engines');

const replacement = `this.vocabulary = (vocabulary || []).map(w => ({
      ...w,
      english: w.original_script || w.english || w.word || '',
      turkish: w.meaning || w.turkish || w.translation || ''
    }));`;

engines.forEach(name => {
  const filePath = path.join(enginesDir, name + '.shell.js');
  let code = fs.readFileSync(filePath, 'utf8');

  // We are looking for `this.vocabulary = vocabulary;` which is in the constructor
  // Wait, some might have `this.vocabulary = vocabulary; // Specific loaded words category`
  
  if (code.includes('this.vocabulary = vocabulary;')) {
    code = code.replace(/this\.vocabulary = vocabulary;[^\n]*/, replacement);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Normalized vocabulary for', name);
  }
});
console.log('Done normalizing vocabularies.');
