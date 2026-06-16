const fs = require('fs');
const pngToIco = require('png-to-ico').default;

pngToIco('C:\\Users\\adem_\\.gemini\\antigravity\\brain\\16f43eb9-0b94-4794-967d-628fc3c8903f\\media__1781478776047.png')
  .then(buf => {
    fs.writeFileSync('favicon.ico', buf);
    console.log('Successfully converted image to favicon.ico');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
