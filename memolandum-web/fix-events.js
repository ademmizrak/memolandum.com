const fs = require('fs');
const path = require('path');
const enginesDir = path.join(__dirname, 'src', 'engines');

const fixWordAscent = () => {
  const file = path.join(enginesDir, 'wordascent.shell.js');
  let code = fs.readFileSync(file, 'utf8');
  const target = /if \(!window\.wordascentKeydownBound\) \{[\s\S]*?\}\);[\s\S]*?\}/;
  if (code.match(target)) {
    code = code.replace(target, `this.keydownHandler = (e) => { if (this.state === 'playing') this.handleKeyDown(e); };
    this.keyupHandler = (e) => { if (this.state === 'playing') this.handleKeyUp(e); };
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);`);
    fs.writeFileSync(file, code, 'utf8');
    console.log('Fixed wordascent');
  }
};

const fixSimpleEvent = (name) => {
  const file = path.join(enginesDir, `${name}.shell.js`);
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace: window.addEventListener('keydown', (e) => { ... })
  // We'll just replace the arrow function registration with named bindings.
  
  if (code.includes(`window.addEventListener('keydown', (e) => {`)) {
    code = code.replace(`window.addEventListener('keydown', (e) => {`, `this.keydownHandler = (e) => {`);
    code = code.replace(`this.keydownHandler = (e) => {`, `this.keydownHandler = (e) => {\n`); // ensure it works
    
    // In bindEvents, we need to append window.addEventListener
    const bindEnd = /bindEvents\(\) \{[\s\S]*?\}\);/g; 
    // This is getting messy with regex. I will just do exact replacements for each.
  }
};

fixWordAscent();
