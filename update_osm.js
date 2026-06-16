const fs = require('fs');

const fallbackStr = fs.readFileSync('fallback_data.js', 'utf8');
const jsonMatch = fallbackStr.match(/const FALLBACK_DATA = (\{[\s\S]+\});/);

if (jsonMatch) {
  const data = JSON.parse(jsonMatch[1]);
  
  const osm100 = JSON.parse(fs.readFileSync('data/Osm_Tr/Osm_tr_100.json', 'utf8'));
  const osm200 = JSON.parse(fs.readFileSync('data/Osm_Tr/Osm_tr_200.json', 'utf8'));
  const osm300 = JSON.parse(fs.readFileSync('data/Osm_Tr/Osm_tr_300.json', 'utf8'));
  const osm400 = JSON.parse(fs.readFileSync('data/Osm_Tr/Osm_tr_400.json', 'utf8'));
  const osm500 = JSON.parse(fs.readFileSync('data/Osm_Tr/Osm_tr_500 .json', 'utf8')); // Note the space in filename
  
  data['Osm_Tr/Osm_tr_100.json'] = osm100;
  data['Osm_Tr/Osm_tr_200.json'] = osm200;
  data['Osm_Tr/Osm_tr_300.json'] = osm300;
  data['Osm_Tr/Osm_tr_400.json'] = osm400;
  data['Osm_Tr/Osm_tr_500 .json'] = osm500;
  
  fs.writeFileSync('fallback_data.js', `// Fallback data compiled automatically from JSON files to allow local file:// execution without CORS errors\nconst FALLBACK_DATA = ${JSON.stringify(data, null, 2)};\n`);
  console.log('Successfully added Osm_Tr data to fallback_data.js');
} else {
  console.log('Failed to parse fallback_data.js');
}
