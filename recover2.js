const fs = require('fs');

let code = fs.readFileSync('.next/dev/static/chunks/memolandum-web_src_09j7htm._.js', 'utf8');

let startIndex = code.indexOf('class BreakoutGame {');
if (startIndex !== -1) {
  let braces = 0;
  let inString = false;
  let stringChar = '';
  let i = startIndex;
  
  for (; i < code.length; i++) {
    let char = code[i];
    
    // String parsing
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (inString) {
      if (char === '\\\\') { // skip escaped char
        i++;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      continue; // Ignore braces inside strings
    }
    
    if (char === '{') {
      braces++;
    } else if (char === '}') {
      braces--;
      if (braces === 0) {
        break; // Reached end of class!
      }
    }
  }
  
  let classCode = code.substring(startIndex, i + 1);
  
  // Clean up Turbopack SoundManager import
  classCode = classCode.replace(/__TURBOPACK__imported__module__.*?\["SoundManager"\]/g, 'SoundManager');
  classCode = classCode.replace(/__TURBOPACK__imported__module__.*?\.\s*SoundManager/g, 'SoundManager');
  
  let finalCode = "import { SoundManager } from './soundManager.js';\n\n" + classCode + "\n\nexport { BreakoutGame };\n";
  fs.writeFileSync('src/engines/breakout.shell.js', finalCode);
  console.log('Successfully perfectly isolated the class and saved it!');
}
