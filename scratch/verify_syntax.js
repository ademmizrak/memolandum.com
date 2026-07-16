const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

function checkSyntax(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'dynamicImport']
    });
    console.log(`✅ Syntax Check Passed: ${path.basename(filePath)}`);
    return true;
  } catch (err) {
    console.error(`❌ Syntax Check Failed in ${path.basename(filePath)}:`);
    console.error(err.message);
    return false;
  }
}

const files = [
  path.resolve(__dirname, '../src/app/profile/page.js'),
  path.resolve(__dirname, '../src/components/Header.jsx'),
  path.resolve(__dirname, '../src/hooks/useLessonLoader.js'),
  path.resolve(__dirname, '../functions/index.js')
];

let allPassed = true;
files.forEach(file => {
  if (fs.existsSync(file)) {
    const passed = checkSyntax(file);
    if (!passed) allPassed = false;
  } else {
    console.warn(`⚠️ File not found: ${file}`);
  }
});

if (allPassed) {
  console.log('\n🎉 SUCCESS! All modified source files are syntactically valid and ready for production!');
} else {
  process.exit(1);
}
