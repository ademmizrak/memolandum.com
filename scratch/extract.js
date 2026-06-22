const fs = require('fs');
const content = fs.readFileSync('D:/000Memorade/index.html', 'utf8');
const match = content.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (match) {
    fs.writeFileSync('D:/000Memorade/scratch/extracted.jsx', match[1], 'utf8');
    console.log('Extracted successfully');
} else {
    console.log('No babel script found');
}
