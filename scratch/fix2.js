const fs = require('fs');
let content = fs.readFileSync('D:/000Memorade/index.html', 'utf8');

const targetStr = `                <button
                  key={lvl.id}
                  onClick={() => handleLevelSelect(lvl.id)}
                  className={\`w-full text-left p-4 rounded-xl border transition-all \${activeCategory === lvl.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#111625] border-gray-800 text-gray-300 hover:border-emerald-500/30'}\`}
                >
                  <div className="font-bold text-sm tracking-wide">{lvl.name}</div>
                </button>`;

const replacementStr = `                <button
                  key={lvl.id}
                  onClick={() => handleLevelSelect(lvl.id)}
                  className={\`w-full text-left p-4 rounded-xl border transition-all \${activeCategory === lvl.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#111625] border-gray-800 text-gray-300 hover:border-emerald-500/30'}\`}
                >
                  <div className="font-bold text-sm tracking-wide">{lvl.label}</div>
                  {lvl.desc && <div className="text-[10px] text-gray-500 mt-1">{lvl.desc}</div>}
                </button>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('D:/000Memorade/index.html', content, 'utf8');
