const fs = require('fs');
const path = 'd:/000Memorade/index.html';
let content = fs.readFileSync(path, 'utf8');

const startStr = "<button onClick={() => toggleLanguagePair('ru_tr')";
const endStr = "</div>\r\n                  )}\r\n                </div>";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf("</button>", content.indexOf("<button onClick={() => toggleLanguagePair('el_tr')")) + 9;

// find the `</div>` that belongs to `showLanguageMenu` which is after `)}` 
let nextStr = content.substring(endIdx, endIdx + 200);
console.log("next string is: ", JSON.stringify(nextStr));

// Let's just find the exact index of `</header>` and replace from `startIdx` to `</header>` minus what's needed.
