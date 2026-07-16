const fs = require('fs');

let code = fs.readFileSync('.next/dev/static/chunks/memolandum-web_src_09j7htm._.js', 'utf8');

let start = code.indexOf('class BreakoutGame');
if (start !== -1) {
  let clean = code.substring(start);
  
  // Find where the chunk ends
  let eEnd = clean.indexOf('__turbopack_export_value__');
  if (eEnd !== -1) {
    clean = clean.substring(0, eEnd);
  }
  let eEnd2 = clean.indexOf('const __TURBOPACK');
  if (eEnd2 !== -1) {
    clean = clean.substring(0, eEnd2);
  }
  let eEnd3 = clean.lastIndexOf('}');
  if (eEnd3 !== -1) {
    // Just find the last closing brace of the class
    // We assume the file ends with the class
  }
  
  // Clean up Turbopack SoundManager import
  // The actual turbopack code looks like:
  // new __TURBOPACK__imported__module__$5b$project...$5d__$28$ecmascript$29$__["SoundManager"]();
  clean = clean.replace(/__TURBOPACK__imported__module__.*?\["SoundManager"\]/g, 'SoundManager');
  clean = clean.replace(/__TURBOPACK__imported__module__.*?\.SoundManager/g, 'SoundManager');

  // Add the import back
  clean = "import { SoundManager } from './soundManager.js';\n\n" + clean;
  
  // Ensure the file ends with the export
  if (!clean.includes('export { BreakoutGame')) {
    clean += '\nexport { BreakoutGame };\n';
  }
  
  fs.writeFileSync('src/engines/breakout.shell.js', clean);
  console.log('Restored breakout.shell.js successfully!');
} else {
  console.log('class BreakoutGame not found in chunk!');
}
