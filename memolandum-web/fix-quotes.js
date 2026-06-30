const fs = require('fs');
const path = require('path');
const enginesDir = path.join(__dirname, 'src', 'engines');

const engines = ['breakout', 'invaders', 'shooter', 'wordascent', 'worddrop', 'highway'];

engines.forEach(name => {
  const filePath = path.join(enginesDir, `${name}.shell.js`);
  if (!fs.existsSync(filePath)) return;
  
  let code = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // We need to replace "\\'.controls-container\\'" with "'.controls-container'"
  // We need to replace "\\'hidden\\'" with "'hidden'"
  
  const badTarget1 = /document\.querySelector\(\\'\.controls-container\\'\);/g;
  const goodTarget1 = "document.querySelector('.controls-container');";
  
  const badTarget2 = /classList\.add\(\\'hidden\\'\);/g;
  const goodTarget2 = "classList.add('hidden');";

  // Let's just do a blanket replacement for the entire line to be safe.
  const badLine = /const el_controls = document\.querySelector\(\\'\.controls-container\\'\); if \(el_controls\) el_controls\.classList\.add\(\\'hidden\\'\);/g;
  const goodLine = "const el_controls = document.querySelector('.controls-container'); if (el_controls) el_controls.classList.add('hidden');";

  if (code.match(badLine)) {
    code = code.replace(badLine, goodLine);
    modified = true;
  }

  // Also check if I missed any generic ones:
  if (code.includes("\\'")) {
    // Just blindly replace any \\' with ' in the file since I might have injected it.
    // Wait, replacing all \\' with ' is safe here since I don't think there are any legitimate \\' in the codebase.
    // But let's just do it directly on the string:
    code = code.replace(/document\.querySelector\(\\'\.controls-container\\'\)/g, "document.querySelector('.controls-container')");
    code = code.replace(/classList\.add\(\\'hidden\\'\)/g, "classList.add('hidden')");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Fixed quotes in', name);
  }
});
