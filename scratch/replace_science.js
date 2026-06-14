const fs = require('fs');
let indexHtml = fs.readFileSync('D:/000Memorade/000Memorade/index.html', 'utf8');
const newScience = fs.readFileSync('D:/000Memorade/000Memorade/scratch/science_output.jsx', 'utf8');

const startMarker = '{/* SCIENCE TAB */}';
const endMarker = '{/* PROGRESS TAB */}';

const startIndex = indexHtml.indexOf(startMarker);
const endIndex = indexHtml.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newHtml = indexHtml.substring(0, startIndex) + newScience + '\n          ' + indexHtml.substring(endIndex);
  fs.writeFileSync('D:/000Memorade/000Memorade/index.html', newHtml);
  console.log('Successfully replaced science tab!');
} else {
  console.log('Markers not found!');
}
