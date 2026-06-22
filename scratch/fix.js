const fs = require('fs');
const lines = fs.readFileSync('D:/000Memorade/index.html', 'utf8').split('\n');

const replacement = [
    '      const rawCats = getCategories(langPair);',
    '      const levels = [',
    '        ...(rawCats.core || []),',
    '        ...(rawCats.sentences || []),',
    '        ...(rawCats.special || []),',
    '        ...(rawCats.yksHazirlik || []),',
    '        ...(rawCats.ydsKelimeleri || [])',
    '      ];'
];

lines.splice(1464, 10, ...replacement);
fs.writeFileSync('D:/000Memorade/index.html', lines.join('\n'), 'utf8');
