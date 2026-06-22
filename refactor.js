const fs = require('fs');

const path = 'd:/000Memorade/index.html';
let content = fs.readFileSync(path, 'utf8');

// 1. DesktopPortal replacement
const startStrDesktop = 'function DesktopPortal({ language, langPair, setLangPair, toggleLanguage, activeShell, setActiveShell, activeCategory, setActiveCategory, setIsDesktopMode, setLanguage, handleLaunchMode }) {';
const endStrDesktop = 'function DesktopSidePanel({ language }) {';

const newDesktopPortal = `function DesktopPortal({ language, langPair, setLangPair, toggleLanguage, activeShell, setActiveShell, activeCategory, setActiveCategory, setIsDesktopMode, setLanguage, handleLaunchMode }) {
      const [showContact, setShowContact] = React.useState(false);
      const [activeDropdown, setActiveDropdown] = React.useState(false);
      
      const manifest = window.DATA_MANIFEST || { singleLanguages: [], englishCategories: [] };
      const currentLanguageObj = manifest.singleLanguages.find(l => l.files.some(f => f.path === activeCategory)) || null;
      const currentEngCatObj = manifest.englishCategories.find(c => c.files.some(f => f.path === activeCategory)) || null;

      const currentLanguage = currentLanguageObj ? currentLanguageObj.id : 'English';
      const currentEnglishCategory = currentEngCatObj ? currentEngCatObj.id : (manifest.englishCategories.length > 0 ? manifest.englishCategories[0].id : null);

      const handleShellSelect = (shell) => {
        setActiveShell(shell);
        if (typeof handleLaunchMode === 'function') {
          handleLaunchMode(shell);
        } else if (typeof window.switchGameShell === 'function') {
          window.switchGameShell(shell);
        }
      };

      const handleLevelSelect = (levelPath) => {
        setActiveCategory(levelPath);
        if (typeof handleLaunchMode === 'function') {
          handleLaunchMode(activeShell);
        }
      };

      let activeLevels = [];
      if (currentLanguage === 'English') {
        const cat = manifest.englishCategories.find(c => c.id === currentEnglishCategory);
        if (cat) activeLevels = cat.files;
      } else {
        const lang = manifest.singleLanguages.find(l => l.id === currentLanguage);
        if (lang) activeLevels = lang.files;
      }

      const shells = [
        { id: 'shooter', title: 'Cosmic Shooter', desc: language === 'TR' ? 'Hızlı refleks + kelime patlatma' : 'Fast reflex + word blast', icon: '🚀', color: 'cyan' },
        { id: 'breakout', title: 'Neon Breakout', desc: language === 'TR' ? 'Tuğla kırma + anlam eşleştirme' : 'Brick breaker + matching', icon: '🧱', color: 'pink' },
        { id: 'worddrop', title: 'Data Drop', desc: language === 'TR' ? 'Düşen harfler + heceleme' : 'Falling letters + spelling', icon: '💧', color: 'yellow' },
        { id: 'highway', title: 'Cyber Highway', desc: language === 'TR' ? '3 Şeritli yarış + doğru şıkkı bulma' : '3-Lane race + correct choice', icon: '🏎️', color: 'purple' },
        { id: 'wordascent', title: 'Hacker Ascent', desc: language === 'TR' ? 'Yukarı tırmanış + boşluk doldurma' : 'Climbing + fill blanks', icon: '🧗', color: 'green' },
        { id: 'invaders', title: 'Space Invaders', desc: language === 'TR' ? 'Gelen saldırıları geri püskürt' : 'Repel incoming attacks', icon: '👾', color: 'red' }
      ];

      return (
        <div className="w-full h-full flex flex-col pointer-events-none text-white font-body relative">
          
          <div className="w-full h-[64px] bg-[#0a0f1d] border-b border-gray-800 flex flex-col justify-center shrink-0 pointer-events-auto z-50">
            <div className="flex justify-between items-center px-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🕹️</span>
                <h1 className="text-2xl font-black tracking-widest text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]">MEMOLANDUM</h1>
                <span className="text-xs text-emerald-500 uppercase font-bold ml-2">Desktop Portal</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#111625] px-4 py-1.5 rounded-lg border border-gray-800 relative">
                  
                  {manifest.singleLanguages.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        if (lang.files.length > 0) handleLevelSelect(lang.files[0].path);
                        setActiveDropdown(false);
                      }}
                      className={\`px-3 py-1 rounded text-xs font-bold transition-colors \${currentLanguage === lang.id ? 'bg-cyan-500 text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'}\`}
                    >
                      {lang.label}
                    </button>
                  ))}

                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(!activeDropdown)}
                      className={\`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-colors \${currentLanguage === 'English' ? 'bg-cyan-500 text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'}\`}
                    >
                      English
                      <svg className={\`w-3 h-3 transition-transform \${activeDropdown ? 'rotate-180' : ''}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {activeDropdown && (
                      <div className="absolute top-full mt-2 w-48 bg-[#0f1629] border border-cyan-500/50 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] z-50 overflow-hidden flex flex-col py-1">
                        {manifest.englishCategories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              if (cat.files.length > 0) handleLevelSelect(cat.files[0].path);
                              setActiveDropdown(false);
                            }}
                            className={\`px-4 py-2 text-xs font-bold text-left hover:bg-cyan-900/40 transition-colors \${currentLanguage === 'English' && currentEnglishCategory === cat.id ? 'text-cyan-300 bg-cyan-900/20' : 'text-gray-300'}\`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (typeof cleanControlButtons === 'function') cleanControlButtons();
                    const legacyResume = document.getElementById('resume-btn-main');
                    if (legacyResume) legacyResume.click();
                    setIsDesktopMode(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-bold text-xs hover:bg-yellow-500/30 transition-colors uppercase tracking-wider flex items-center gap-2"
                >
                  📱 Mobil Retro Görünüm
                </button>
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-row w-full overflow-hidden">
            
            <div className="w-[320px] shrink-0 bg-[#0d1222] border-r border-gray-800 pointer-events-auto overflow-y-auto custom-scrollbar p-6 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col gap-3">
              <h3 className="text-xs font-black tracking-widest text-emerald-400 mb-2 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Eğitim Seviyeleri
              </h3>
              {activeLevels.map(lvl => (
                <button
                  key={lvl.path}
                  onClick={() => handleLevelSelect(lvl.path)}
                  className={\`w-full text-left p-4 rounded-xl border transition-all \${activeCategory === lvl.path ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#111625] border-gray-800 text-gray-300 hover:border-emerald-500/30'}\`}
                >
                  <div className="font-bold text-sm tracking-wide">{lvl.label}</div>
                </button>
              ))}
            </div>

            <div className="flex-grow relative pointer-events-none">
               {activeShell === 'about' && (
                 <div className="absolute inset-0 pointer-events-auto z-[60] bg-[#05020a]/95 backdrop-blur-md overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                   <div className="w-full p-4 flex justify-end shrink-0">
                     <button 
                       onClick={() => handleShellSelect('shooter')}
                       className="flex items-center gap-2 text-cyan-400 hover:text-white px-4 py-2 rounded-lg bg-[#111625] border border-cyan-500/30 transition-all font-black text-xs uppercase tracking-widest hover:border-cyan-400"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                       {language === 'TR' ? 'KAPAT' : 'CLOSE'}
                     </button>
                   </div>
                   <iframe src="about.html" className="w-full flex-grow border-none" title="About Us & Science" />
                 </div>
               )}
            </div>

            <div className="w-[320px] shrink-0 bg-[#0d1222] border-l border-gray-800 pointer-events-auto overflow-y-auto custom-scrollbar p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col gap-3">
              <h3 className="text-xs font-black tracking-widest text-cyan-400 mb-2 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Oyun Modülleri
              </h3>
              {shells.map(game => {
                const isSelected = activeShell === game.id;
                
                const colors = {
                  cyan: 'border-cyan-500/35 hover:border-cyan-400/70',
                  pink: 'border-pink-500/35 hover:border-pink-400/70',
                  yellow: 'border-yellow-500/35 hover:border-yellow-400/70',
                  purple: 'border-purple-500/35 hover:border-purple-400/70',
                  green: 'border-emerald-500/35 hover:border-emerald-400/70',
                  red: 'border-red-500/35 hover:border-red-400/70'
                };

                const selectedColors = {
                  cyan: 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] bg-cyan-900/20 text-cyan-400',
                  pink: 'border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)] bg-pink-900/20 text-pink-400',
                  yellow: 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] bg-yellow-900/20 text-yellow-400',
                  purple: 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] bg-purple-900/20 text-purple-400',
                  green: 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-emerald-900/20 text-emerald-400',
                  red: 'border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] bg-red-900/20 text-red-400'
                };

                const borderStyle = isSelected ? selectedColors[game.color] : colors[game.color];

                return (
                  <button
                    key={game.id}
                    onClick={() => handleShellSelect(game.id)}
                    className={\`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 \${borderStyle} \${!isSelected ? 'bg-[#111625] text-gray-300' : ''}\`}
                  >
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gray-900 border border-gray-800">
                      {game.icon}
                    </div>
                    <div>
                      <div className="font-black text-[13px] uppercase tracking-wider mb-0.5">{game.title}</div>
                      <div className="text-[10px] text-gray-500 leading-tight">{game.desc}</div>
                    </div>
                  </button>
                );
              })}

              <button 
                onClick={() => handleShellSelect('about')}
                className="w-full flex flex-shrink-0 items-center justify-center p-4 mt-auto bg-gradient-to-r from-[#111625]/90 to-purple-900/20 border-2 border-cyan-500/30 rounded-xl text-center active:scale-95 duration-100 hover:border-cyan-400/70 shadow-[0_0_10px_rgba(6,182,212,0.15)] transition-all gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h4 className="text-[11px] font-black tracking-wider text-white uppercase">{language === 'TR' ? 'Hakkımızda & Bilim' : 'About Us & Science'}</h4>
              </button>
            </div>
            
          </div>

          <div className="w-full h-[48px] bg-[#0a0f1d] border-t border-gray-800 pointer-events-auto px-4 flex justify-between items-center text-xs text-gray-500 font-bold tracking-widest shrink-0 z-50">
            <div>© 2026 MEMOLANDUM.COM</div>
            <div className="flex gap-6">
              <button onClick={(e) => { e.preventDefault(); setShowContact(true); }} className="hover:text-cyan-400 transition-colors uppercase tracking-widest cursor-pointer">İletişim</button>
              <a href="https://kreosus.com/httpsmemolandumcom" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Destek</a>
              <button onClick={(e) => e.preventDefault()} className="hover:text-yellow-400 transition-colors uppercase tracking-widest cursor-not-allowed opacity-50" title="Şimdilik beklemede">Gizlilik Politikası</button>
            </div>
          </div>

          {showContact && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
              <div className="bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.2)] relative min-w-[300px] flex flex-col items-center">
                <button 
                  onClick={() => setShowContact(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white hover:rotate-90 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
                <div className="w-16 h-16 rounded-full bg-cyan-900/30 border border-cyan-500/50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-black tracking-widest text-white uppercase mb-2">İletişim</h3>
                <p className="text-cyan-400 font-mono text-lg tracking-wider bg-[#111625] px-4 py-2 rounded-lg border border-cyan-500/20 select-all">
                  info@memolandum.com
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
\n`;

let startIndex = content.indexOf(startStrDesktop);
let endIndex = content.indexOf(endStrDesktop);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newDesktopPortal + content.substring(endIndex);
  console.log('DesktopPortal replaced.');
} else {
  console.log('DesktopPortal indices not found.');
  console.log('Start index: ' + startIndex);
  console.log('End index: ' + endIndex);
  process.exit(1);
}

// 2. Mobile Grid replacement
const startStrMobile = '{/* SECTION 1: SECTOR SELECTION (Direct) */}';
const endStrMobile = '{/* SECTION 2: CHOOSE GAME CABINET (Direct) */}';

const newMobileGrid = `{/* SECTION 1: SECTOR SELECTION (Direct) */}
              <div className="w-full mb-6 relative">
                <div className="px-1 mb-3 text-left">
                  <h2 className="text-sm font-black text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    1. ESTABLISH SECTOR LINK
                  </h2>
                  <p className="text-[11px] text-gray-500 font-bold uppercase mt-0.5">
                    Select a translation database to connect with the shells
                  </p>
                </div>

                {(() => {
                  const manifest = window.DATA_MANIFEST || { singleLanguages: [], englishCategories: [] };
                  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
                  
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
                    <div className="w-full">
                      <button 
                        onClick={() => setMobileMenuOpen(true)}
                        className={\`w-full mb-3 py-3 rounded-xl border-2 transition-all font-black tracking-widest flex items-center justify-between px-4 \${currentLanguage === 'English' ? 'border-cyan-400 bg-cyan-900/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'border-gray-800 bg-[#111625] text-gray-400 hover:border-cyan-500/50 hover:text-white'}\`}
                      >
                        <span className="flex items-center gap-2">
                          🇬🇧 ENGLISH <span className="text-[10px] bg-cyan-900/50 text-cyan-400 px-2 py-0.5 rounded ml-2">{currentEnglishCategory ? manifest.englishCategories.find(c=>c.id === currentEnglishCategory)?.label : ''}</span>
                        </span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                      </button>

                      {mobileMenuOpen && (
                        <div className="absolute top-0 left-0 w-full h-[400px] z-[70] bg-[#0d1222] border border-cyan-500/50 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-y-auto custom-scrollbar">
                          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                            <h3 className="text-cyan-400 font-black tracking-widest">ENGLISH CATEGORIES</h3>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                          </div>
                          <div className="flex flex-col gap-2">
                            {manifest.englishCategories.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => {
                                  if (cat.files.length > 0) {
                                    handleSelectCategory(cat.files[0].path);
                                  }
                                  setMobileMenuOpen(false);
                                }}
                                className={\`text-left p-3 rounded-lg border transition-all \${currentEnglishCategory === cat.id ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-[#111625] border-gray-800 text-gray-300 hover:border-cyan-500/30'}\`}
                              >
                                <div className="font-bold text-sm">{cat.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {manifest.singleLanguages.map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => {
                              if (lang.files.length > 0) {
                                handleSelectCategory(lang.files[0].path);
                              }
                            }}
                            className={\`py-2 rounded-xl border-2 transition-all font-bold text-[11px] tracking-wider flex items-center justify-center \${currentLanguage === lang.id ? 'border-emerald-400 bg-emerald-900/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-gray-800 bg-[#111625] text-gray-400 hover:border-emerald-500/50 hover:text-white'}\`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>

                      <div className="bg-[#111625]/50 border border-gray-800 rounded-xl p-3 h-[250px] overflow-y-auto custom-scrollbar">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-2 ml-1">
                          Levels / Datasets
                        </div>
                        <div className="flex flex-col gap-2">
                          {activeLevels.map(lvl => (
                            <button
                              key={lvl.path}
                              onClick={() => handleSelectCategory(lvl.path)}
                              className={\`w-full text-left p-3 rounded-lg border transition-all \${activeCategory === lvl.path ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-[#0d1222] border-gray-800 text-gray-300 hover:border-cyan-500/30'}\`}
                            >
                              <div className="font-bold text-xs leading-tight">{lvl.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              `;

let startIdxMobile = content.indexOf(startStrMobile);
let endIdxMobile = content.indexOf(endStrMobile);

if (startIdxMobile !== -1 && endIdxMobile !== -1) {
  content = content.substring(0, startIdxMobile) + newMobileGrid + content.substring(endIdxMobile);
  console.log('Mobile Grid replaced.');
} else {
  console.log('Mobile Grid indices not found.');
  console.log('Start index: ' + startIdxMobile);
  console.log('End index: ' + endIdxMobile);
  process.exit(1);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Refactoring completed successfully.');
