const fs = require('fs');
const path = 'd:/000Memorade/index.html';
let content = fs.readFileSync(path, 'utf8');

const startStr = "<button onClick={() => toggleLanguagePair('ru_tr')";
const startIdx = content.indexOf(startStr);

const endIdx = content.indexOf("</button>", content.indexOf("<button onClick={() => toggleLanguagePair('el_tr')")) + 9;

const endStr = "\r\n                    </div>\r\n                  )}\r\n                </div>";
const absoluteEndIdx = content.indexOf(endStr, endIdx) + endStr.length;

if (startIdx !== -1 && absoluteEndIdx !== -1) {
  const newMenu = `{(() => {
                  const manifest = window.DATA_MANIFEST || { singleLanguages: [], englishCategories: [] };
                  const currentLanguageObj = manifest.singleLanguages.find(l => l.files.some(f => f.path === activeCategory)) || null;
                  const currentEngCatObj = manifest.englishCategories.find(c => c.files.some(f => f.path === activeCategory)) || null;

                  return (
                    <div className="relative">
                      <button 
                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#181d2e] border border-gray-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500 transition-all shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                      >
                        🌐
                      </button>

                      {showLanguageMenu && (
                        <div className="absolute right-0 top-10 w-[200px] bg-[#0f1629] border border-cyan-500/50 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] z-50 overflow-y-auto max-h-[350px] custom-scrollbar flex flex-col">
                          <div className="px-4 py-2 bg-[#111625] border-b border-gray-800 text-[10px] font-black text-cyan-500 tracking-widest uppercase">
                            İngilizce
                          </div>
                          {manifest.englishCategories.map(cat => (
                            <button 
                              key={cat.id}
                              onClick={() => {
                                if (cat.files.length > 0) {
                                  setActiveCategory(cat.files[0].path);
                                  if (typeof window.loadLevel === 'function') window.loadLevel(cat.files[0].path);
                                }
                                setShowLanguageMenu(false);
                              }} 
                              className={\`px-4 py-3 text-xs font-bold text-left hover:bg-cyan-900/40 transition-colors border-b border-gray-800/50 \${currentEngCatObj && currentEngCatObj.id === cat.id ? 'text-cyan-300 bg-cyan-900/20' : 'text-gray-300'}\`}
                            >
                              🇬🇧 {cat.label}
                            </button>
                          ))}
                          <div className="px-4 py-2 bg-[#111625] border-y border-gray-800 text-[10px] font-black text-emerald-500 tracking-widest uppercase mt-1">
                            Diğer Diller
                          </div>
                          {manifest.singleLanguages.map(lang => (
                            <button 
                              key={lang.id}
                              onClick={() => {
                                if (lang.files.length > 0) {
                                  setActiveCategory(lang.files[0].path);
                                  if (typeof window.loadLevel === 'function') window.loadLevel(lang.files[0].path);
                                }
                                setShowLanguageMenu(false);
                              }} 
                              className={\`px-4 py-3 text-xs font-bold text-left hover:bg-emerald-900/40 transition-colors border-b border-gray-800/50 \${currentLanguageObj && currentLanguageObj.id === lang.id ? 'text-emerald-300 bg-emerald-900/20' : 'text-gray-300'}\`}
                            >
                              🌐 {lang.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}`;
  
  content = content.substring(0, startIdx) + newMenu + content.substring(absoluteEndIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Successfully replaced the missing tags.");
} else {
  console.log("Could not find start or end index.");
}
