const fs = require('fs');
let code = fs.readFileSync('memolandum-web/src/engines/shooter.shell.js', 'utf8');
code = code.replace(/\\'\.controls-container\\'/g, "'.controls-container'");
fs.writeFileSync('memolandum-web/src/engines/shooter.shell.js', code);
