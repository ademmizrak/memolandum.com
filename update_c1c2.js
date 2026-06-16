const fs = require('fs');

const fallbackStr = fs.readFileSync('fallback_data.js', 'utf8');
const jsonMatch = fallbackStr.match(/const FALLBACK_DATA = (\{[\s\S]+\});/);

if (jsonMatch) {
  const data = JSON.parse(jsonMatch[1]);
  
  const c1 = JSON.parse(fs.readFileSync('data/C1_words.json', 'utf8'));
  const c2 = JSON.parse(fs.readFileSync('data/C2_words.json', 'utf8'));
  
  data['c1_words.json'] = c1;
  data['c2_words.json'] = c2;
  
  fs.writeFileSync('fallback_data.js', `// Fallback data compiled automatically from JSON files to allow local file:// execution without CORS errors\nconst FALLBACK_DATA = ${JSON.stringify(data, null, 2)};\n`);
  console.log('Successfully added C1 and C2 to fallback_data.js');
} else {
  console.log('Failed to parse fallback_data.js');
}
