const fs = require('fs');
const path = require('path');
const enginesDir = path.join(__dirname, 'src', 'engines');
const files = fs.readdirSync(enginesDir).filter(f => f.endsWith('.shell.js'));

files.forEach(file => {
  const filePath = path.join(enginesDir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace showMainMenu() with window.location.href = '/'
  if (code.includes('showMainMenu();')) {
    code = code.replace(/showMainMenu\(\);/g, "window.location.href = '/';");
    modified = true;
  }

  // Fix pauseBtn.textContent throws if pauseBtn is null
  if (code.includes("pauseBtn.textContent = '▶';")) {
    code = code.replace(/pauseBtn\.textContent = '▶';/g, "if (pauseBtn) pauseBtn.textContent = '▶';");
    modified = true;
  }
  if (code.includes("pauseBtn.textContent = '❚❚';")) {
    code = code.replace(/pauseBtn\.textContent = '❚❚';/g, "if (pauseBtn) pauseBtn.textContent = '❚❚';");
    modified = true;
  }
  
  if (code.includes("pauseBtn.style.color =")) {
    code = code.replace(/pauseBtn\.style\.color =/g, "if (pauseBtn) pauseBtn.style.color =");
    modified = true;
  }
  if (code.includes("pauseBtn.style.borderColor =")) {
    code = code.replace(/pauseBtn\.style\.borderColor =/g, "if (pauseBtn) pauseBtn.style.borderColor =");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Fixed pauseBtn and showMainMenu in', file);
  }
});
