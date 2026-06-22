const fs = require('fs');
const path = 'd:/000Memorade/index.html';
let content = fs.readFileSync(path, 'utf8');

// 1. DesktopPortal replacement
const desktopStartStr = '<div className="flex items-center gap-4">';
const desktopEndStr = '<button\n                  onClick={() => {';
const newDesktopTopBar = `<div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pr-2">
                <div className="flex items-center gap-2 bg-[#111625] px-4 py-1.5 rounded-lg border border-gray-800 shrink-0">
                  {manifest.englishCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (cat.files.length > 0) handleLevelSelect(cat.files[0].path);
                      }}
                      className={\`px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap \${currentLanguage === 'English' && currentEnglishCategory === cat.id ? 'bg-cyan-500 text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'}\`}
                    >
                      {cat.label}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-gray-800 mx-2"></div>
                  {manifest.singleLanguages.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        if (lang.files.length > 0) handleLevelSelect(lang.files[0].path);
                      }}
                      className={\`px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap \${currentLanguage === lang.id ? 'bg-emerald-500 text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'}\`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => {`;

// 2. Mobile Home globe menu replacement
const globeStartStr = '<div className="relative">\n                  <button \n                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}';
const globeEndStr = '</div>\n                  )}\n                </div>';
const newGlobeMenu = `<div className="relative">
                  <button 
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#181d2e] border border-gray-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500 transition-all shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                  >
                    🌐
                  </button>

                  {showLanguageMenu && (
                    <div className="absolute right-0 top-10 w-64 bg-[#0f1629] border border-cyan-500/50 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] z-50 overflow-y-auto max-h-[350px] custom-scrollbar flex flex-col">
                      <div className="px-4 py-2 bg-[#111625] border-b border-gray-800 text-[10px] font-black text-cyan-500 tracking-widest uppercase">
                        English Categories
                      </div>
                      {window.DATA_MANIFEST?.englishCategories.map(cat => (
                        <button 
                          key={cat.id}
                          onClick={() => {
                            if (cat.files.length > 0) setActiveCategory(cat.files[0].path);
                            setShowLanguageMenu(false);
                          }} 
                          className={\`px-4 py-3 text-xs font-bold text-left hover:bg-cyan-900/40 transition-colors border-b border-gray-800/50 \${activeCategory.includes(cat.id) ? 'text-cyan-300 bg-cyan-900/20' : 'text-gray-300'}\`}
                        >
                          🇬🇧 {cat.label}
                        </button>
                      ))}
                      <div className="px-4 py-2 bg-[#111625] border-y border-gray-800 text-[10px] font-black text-emerald-500 tracking-widest uppercase">
                        Other Languages
                      </div>
                      {window.DATA_MANIFEST?.singleLanguages.map(lang => (
                        <button 
                          key={lang.id}
                          onClick={() => {
                            if (lang.files.length > 0) setActiveCategory(lang.files[0].path);
                            setShowLanguageMenu(false);
                          }} 
                          className={\`px-4 py-3 text-xs font-bold text-left hover:bg-emerald-900/40 transition-colors border-b border-gray-800/50 \${activeCategory.includes(lang.id) ? 'text-emerald-300 bg-emerald-900/20' : 'text-gray-300'}\`}
                        >
                          🌐 {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>`;

// 3. Remove mobile Grid block and inject "LEVELS / DATASETS" below Game selection
const gridStartStr = '{/* SECTION 1: SECTOR SELECTION (Direct) */}';
const gridEndStr = '{/* SECTION 2: CHOOSE GAME CABINET (Direct) */}';
const removeGridStr = ``;

// 4. Inject "LEVELS / DATASETS" below the activeShell grid
const gamesEndStr = '</div>\n              </div>\n\n            </div>\n          )}\n\n          {/* SCIENCE TAB */}';
const levelsSection = `</div>
              </div>

              {/* SECTION 3: LEVELS / DATASETS */}
              <div className="w-full mb-6 mt-4">
                <div className="px-1 mb-2 text-left">
                  <h2 className="text-sm font-black text-emerald-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    3. SELECT DATASET LEVEL
                  </h2>
                </div>
                {(() => {
                  const manifest = window.DATA_MANIFEST || { singleLanguages: [], englishCategories: [] };
                  const currentLanguageObj = manifest.singleLanguages.find(l => l.files.some(f => f.path === activeCategory)) || null;
                  const currentEngCatObj = manifest.englishCategories.find(c => c.files.some(f => f.path === activeCategory)) || null;

                  const currentLanguage = currentLanguageObj ? currentLanguageObj.id : 'English';
                  const currentEnglishCategory = currentEngCatObj ? currentEngCatObj.id : (manifest.englishCategories.length > 0 ? manifest.englishCategories[0].id : null);
                  
                  let activeLevels = [];
                  if (currentLanguage === 'English') {
                    const cat = manifest.englishCategories.find(c => c.id === currentEnglishCategory);
                    if (cat) activeLevels = cat.files;
                  } else {
                    const lang = manifest.singleLanguages.find(l => l.id === currentLanguage);
                    if (lang) activeLevels = lang.files;
                  }

                  return (
                    <div className="bg-[#111625]/80 border border-gray-800 rounded-xl p-3 h-[250px] overflow-y-auto custom-scrollbar">
                      <div className="flex flex-col gap-2">
                        {activeLevels.map(lvl => (
                          <button
                            key={lvl.path}
                            onClick={() => {
                              setActiveCategory(lvl.path);
                              if (typeof window.loadLevel === 'function') {
                                window.loadLevel(lvl.path);
                              }
                            }}
                            className={\`w-full text-left p-3 rounded-lg border transition-all \${activeCategory === lvl.path ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-[#0d1222] border-gray-800 text-gray-300 hover:border-cyan-500/30'}\`}
                          >
                            <div className="font-bold text-xs leading-tight">{lvl.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* SCIENCE TAB */}`;


// Execution
let idx1 = content.indexOf(desktopStartStr);
let idx2 = content.indexOf(desktopEndStr);
if (idx1 !== -1 && idx2 !== -1) {
    content = content.substring(0, idx1) + newDesktopTopBar + content.substring(idx2 + desktopEndStr.length);
    console.log("DesktopPortal top bar modified.");
} else {
    console.log("DesktopPortal bounds not found");
}

let idx3 = content.indexOf(globeStartStr);
let idx4 = content.indexOf(globeEndStr);
if (idx3 !== -1 && idx4 !== -1) {
    content = content.substring(0, idx3) + newGlobeMenu + content.substring(idx4 + globeEndStr.length);
    console.log("MemolandumHome globe menu modified.");
} else {
    console.log("MemolandumHome globe menu bounds not found");
}

let idx5 = content.indexOf(gridStartStr);
let idx6 = content.indexOf(gridEndStr);
if (idx5 !== -1 && idx6 !== -1) {
    content = content.substring(0, idx5) + removeGridStr + content.substring(idx6); // keep gridEndStr
    console.log("MemolandumHome grid removed.");
} else {
    console.log("MemolandumHome grid bounds not found");
}

let idx7 = content.indexOf(gamesEndStr);
if (idx7 !== -1) {
    content = content.substring(0, idx7) + levelsSection + content.substring(idx7 + gamesEndStr.length);
    console.log("MemolandumHome levels section added.");
} else {
    console.log("MemolandumHome games end bounds not found");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Refactoring complete.");
