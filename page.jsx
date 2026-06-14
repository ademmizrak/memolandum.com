import React, { useState, useEffect } from 'react';

// ----------------------------------------------------
// Translation Dictionary & Language Mappings
// ----------------------------------------------------
const TRANSLATIONS = {
  TR: {
    title: "🕹️ MEMOLANDUM 🕹️",
    subtitle: "SİBER KELİME ARCADE",
    resumeTitle: "AKTİF OTURUM ALGILANDI",
    resumeBtn: "GÖREVE DEVAM ET: ",
    levelCardLabel: "Sektör Seviyesi",
    levelActionText: "Sektör Değiştir",
    progressCardLabel: "KELİME PROTOKOLÜ",
    progressWordsLearned: "Kelime Öğrenildi",
    progressComplete: "TAMAMLANDI",
    progressReady: "HAZIR",
    examsCardLabel: "UYARLANABİLİR SINAVLAR",
    examsCardTitle: "Genel Sınav Skoru",
    examsAccuracy: "DOĞRULUK",
    examsActionText: "Sınav Başlat",
    gameModesTitle: "Ağ Sektörleri & Modlar",
    gameModesSubtitle: "Eğitimi başlatmak için bir mod seçin",
    randomPlayBtn: "🎲 RASTGELE OYNA",
    navHome: "Ana Ekran",
    navProgress: "Gelişim",
    navLeaderboard: "Liderlik",
    navProfile: "Profil",
    rocketTitle: "Ateşleyici",
    rocketDesc: "Uzay savaşı ile kelimeleri vur",
    puzzleTitle: "Tuğla Kırıcı",
    puzzleDesc: "Tuğlaları kırarak kelimeleri eşle",
    raceTitle: "Otoban Yarışı",
    raceDesc: "Hızlı yarışta doğru kelimeyi bul",
    cardsTitle: "Kart Eşleme",
    cardsDesc: "Kartları çevirip kelime dağarcığını geliştir",
    joystickTitle: "Atari Arenası",
    joystickDesc: "Klasik blok yerleştirme modu",
    starTitle: "Sınav Blitz",
    starDesc: "Zorlu uyarlanabilir sınav modülü",
    // Level Selection Drawer
    selectLevelTitle: "SEKTÖR AĞI BAĞLANTISI",
    selectLevelSubtitle: "Bağlanmak istediğiniz dil seviyesini seçin",
    closeBtn: "Kapat",
    connectBtn: "BAĞLANTIYI KUR",
    connectedBtn: "BAĞLANTI AKTİF",
    coreLevelsTab: "Çekirdek Seviyeler",
    specializedTab: "Özel Konular",
    // Progress Tab
    statsTitle: "SİBER GELİŞİM VERİLERİ",
    statsSubtitle: "Kelimeleri öğrenme ve ustalaşma oranlarınız",
    totalMastered: "Ustalaşılan Kelime",
    masteryLevel: "Genel Seviye",
    examAvg: "Sınav Başarısı",
    gemsCollected: "Toplanan Kristaller",
    // Leaderboard Tab
    leaderboardTitle: "LİDERLİK TABLOSU",
    leaderboardSubtitle: "En yüksek puan alan kadet listesi",
    rank: "DERECE",
    pilot: "PİLOT KODU",
    score: "SKOR",
    // Profile Tab
    profileTitle: "KULLANICI PROFİLİ",
    profileSubtitle: "Pilot istatistikleri ve siber donanım",
    aboutBtn: "Hakkımızda & Bilim",
    resetData: "Verileri Sıfırla",
    resetWarning: "Tüm kelime gelişiminiz ve puanlarınız silinecektir!",
    resetConfirm: "Evet, Sıfırla",
    resetSuccess: "Veritabanı sıfırlandı."
  },
  ENG: {
    title: "🕹️ MEMOLANDUM 🕹️",
    subtitle: "CYBER VOCABULARY ARCADE",
    resumeTitle: "ACTIVE SESSION DETECTED",
    resumeBtn: "RESUME MISSION: ",
    levelCardLabel: "Sector Level",
    levelActionText: "Change Sector",
    progressCardLabel: "VOCAB PROTOCOL",
    progressWordsLearned: "Words Learned",
    progressComplete: "COMPLETE",
    progressReady: "READY",
    examsCardLabel: "ADAPTIVE EXAMS",
    examsCardTitle: "Overall Exam Score",
    examsAccuracy: "ACCURACY",
    examsActionText: "Start Exam",
    gameModesTitle: "Network Sectors & Modes",
    gameModesSubtitle: "Select a game module to initialize",
    randomPlayBtn: "🎲 RANDOM PLAY",
    navHome: "Home",
    navProgress: "Progress",
    navLeaderboard: "Leaderboard",
    navProfile: "Profile",
    rocketTitle: "Rocket / Shooter",
    rocketDesc: "Shoot down vocabulary in outer space",
    puzzleTitle: "Puzzle / Breakout",
    puzzleDesc: "Break bricks to resolve translations",
    raceTitle: "Race Car / Racer",
    raceDesc: "Drive fast to match vocabulary",
    cardsTitle: "Cards / Card Flip",
    cardsDesc: "Flip card blocks to matching terms",
    joystickTitle: "Arcade / Word Drop",
    joystickDesc: "Classic falling block matrix arena",
    starTitle: "Star / Exam Blitz",
    starDesc: "Launch adaptive evaluation module",
    // Level Selection Drawer
    selectLevelTitle: "SECTOR NETWORK LINK",
    selectLevelSubtitle: "Select the vocabulary sector to establish connection",
    closeBtn: "Close",
    connectBtn: "CONNECT SECTOR",
    connectedBtn: "LINK ESTABLISHED",
    coreLevelsTab: "Core Levels",
    specializedTab: "Specialized",
    // Progress Tab
    statsTitle: "CYBER PROGRESS LOGS",
    statsSubtitle: "Your vocab mastery and learning indices",
    totalMastered: "Total Words Mastered",
    masteryLevel: "Global Rank",
    examAvg: "Exam Average",
    gemsCollected: "Crystals Harvested",
    // Leaderboard Tab
    leaderboardTitle: "CYBER LEADERBOARD",
    leaderboardSubtitle: "Top scoring vocabulary cadets",
    rank: "RANK",
    pilot: "PILOT CALLSIGN",
    score: "SCORE",
    // Profile Tab
    profileTitle: "CADET PROFILE",
    profileSubtitle: "Pilot metadata and system registers",
    aboutBtn: "About Us & Science",
    resetData: "Wipe System Registers",
    resetWarning: "This will permanently delete your database progress!",
    resetConfirm: "Yes, Format Database",
    resetSuccess: "System registers formatted."
  }
};

const getCategoryDisplayName = (jsonFileName, lang) => {
  const TR_Names = {
    'a1_words.json': 'A1 - Başlangıç Seviyesi',
    'a2_words.json': 'A2 - Temel Seviye',
    'b1_words.json': 'B1 - Orta Seviye',
    'b2_words.json': 'B2 - İleri Orta Seviye',
    'phrasal_verbs.json': 'Kritik Phrasal Verbler',
    'conjunctions.json': 'Akademik Bağlaçlar',
    'academic_verbs.json': 'Akademik Fiiller',
    'prepositions.json': 'Edatlar & Collocation',
    'abstract_adjectives.json': 'Soyut Sıfatlar'
  };
  const ENG_Names = {
    'a1_words.json': 'A1 - Beginner Level',
    'a2_words.json': 'A2 - Elementary Level',
    'b1_words.json': 'B1 - Intermediate Level',
    'b2_words.json': 'B2 - Upper Intermediate',
    'phrasal_verbs.json': 'Critical Phrasal Verbs',
    'conjunctions.json': 'Academic Conjunctions',
    'academic_verbs.json': 'Advanced Verbs',
    'prepositions.json': 'Prepositions & Collocs',
    'abstract_adjectives.json': 'Abstract Adjectives'
  };
  return lang === 'TR' ? (TR_Names[jsonFileName] || 'Bilinmeyen Sektör') : (ENG_Names[jsonFileName] || 'Unknown Sector');
};

const CATEGORIES = {
  core: [
    { id: 'a1_words.json', label: 'A1 - Beginner', desc: 'Start your training with fundamental words.' },
    { id: 'a2_words.json', label: 'A2 - Elementary', desc: 'Expand vocabulary with common phrases.' },
    { id: 'b1_words.json', label: 'B1 - Intermediate', desc: 'Enhance key intermediate words.' },
    { id: 'b2_words.json', label: 'B2 - Upper Intermediate', desc: 'Master complex terms for fluent speech.' }
  ],
  special: [
    { id: 'phrasal_verbs.json', label: 'Phrasal Verbs', desc: 'Phrasal verbs with contextual pairings.' },
    { id: 'conjunctions.json', label: 'Conjunctions', desc: 'Advanced transitions and sentence linkers.' },
    { id: 'academic_verbs.json', label: 'Advanced Verbs', desc: 'High frequency academic action words.' },
    { id: 'prepositions.json', label: 'Prepositions', desc: 'Key prepositions and word collocations.' },
    { id: 'abstract_adjectives.json', label: 'Abstract Adjectives', desc: 'Adjectives representing abstract systems.' }
  ]
};

// ----------------------------------------------------
// Home Main Component
// ----------------------------------------------------
export default function MemolandumHome() {
  const [language, setLanguage] = useState('ENG');
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'progress', 'leaderboard', 'profile'
  const [activeShell, setActiveShell] = useState('shooter');
  const [activeCategory, setActiveCategory] = useState('a1_words.json');
  const [selectedSpeed, setSelectedSpeed] = useState('normal');
  const [showLevelDrawer, setShowLevelDrawer] = useState(false);
  const [levelsTab, setLevelsTab] = useState('core'); // 'core', 'special'

  // Progress variables calculated from local storage & fallbacks
  const [savedStage, setSavedStage] = useState(null);
  const [savedLevel, setSavedLevel] = useState(1);
  const [savedScore, setSavedScore] = useState(0);
  const [collectedGems, setCollectedGems] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [vocabProgress, setVocabProgress] = useState({ mastered: 325, total: 500, pct: 65 });

  const t = TRANSLATIONS[language];

  // ----------------------------------------------------
  // Lifecycle Hooks & Data Synchronization
  // ----------------------------------------------------
  useEffect(() => {
    // Read state from localStorage on mount
    const stage = localStorage.getItem('memolandum_saved_stage');
    const level = parseInt(localStorage.getItem('memolandum_saved_level')) || 1;
    const score = parseInt(localStorage.getItem('memolandum_saved_score')) || 0;
    const gems = parseInt(localStorage.getItem('memolandum_collected_gems')) || 0;
    const high = parseInt(localStorage.getItem('memolandum_high_score')) || 0;
    const activeSh = localStorage.getItem('memolandum_active_shell') || 'shooter';

    if (stage) {
      setSavedStage(stage);
      setSavedLevel(level);
      setSavedScore(score);
      setActiveCategory(stage);
    }
    setCollectedGems(gems);
    setHighScore(high);
    setActiveShell(activeSh);
    
    // Read active language if set
    const lang = localStorage.getItem('memolandum_lang');
    if (lang) setLanguage(lang);

    // Initial progress computation
    computeCategoryProgress(stage || 'a1_words.json');

    // Attach click listener to the document and check state overrides
    const handleStorageUpdate = () => {
      const g = parseInt(localStorage.getItem('memolandum_collected_gems')) || 0;
      const h = parseInt(localStorage.getItem('memolandum_high_score')) || 0;
      setCollectedGems(g);
      setHighScore(h);
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const computeCategoryProgress = (categoryName) => {
    try {
      const dbStr = localStorage.getItem('memolandum_mastery_db');
      const db = dbStr ? JSON.parse(dbStr) : {};
      
      let words = [];
      if (window.FALLBACK_DATA && window.FALLBACK_DATA[categoryName]) {
        words = window.FALLBACK_DATA[categoryName];
      } else {
        // Fallback default word counts if FALLBACK_DATA is not loaded yet
        const lengthMap = {
          'a1_words.json': 100, 'a2_words.json': 100, 'b1_words.json': 100, 'b2_words.json': 100,
          'phrasal_verbs.json': 50, 'conjunctions.json': 50, 'academic_verbs.json': 50,
          'prepositions.json': 50, 'abstract_adjectives.json': 50
        };
        const mockTotal = lengthMap[categoryName] || 100;
        // Mock progress matching user Progress Points
        const mockMastered = Math.min(mockTotal, Math.round(mockTotal * 0.65));
        setVocabProgress({ mastered: mockMastered, total: mockTotal, pct: 65 });
        return;
      }

      let mastered = 0;
      words.forEach(w => {
        const key = (w.word || w.en || "").toString().toUpperCase();
        if (key && db[key] && db[key].totalHits >= 3) {
          mastered++;
        }
      });

      const total = words.length;
      const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
      setVocabProgress({ mastered, total, pct });
    } catch (e) {
      console.warn("Could not calculate actual database progress, defaulting.", e);
      setVocabProgress({ mastered: 325, total: 500, pct: 65 });
    }
  };

  // ----------------------------------------------------
  // Navigation & Interactive Methods
  // ----------------------------------------------------
  const toggleLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('memolandum_lang', lang);
  };

  const handleSelectShell = (shellName) => {
    setActiveShell(shellName);
    if (typeof window.switchGameShell === 'function') {
      window.switchGameShell(shellName);
    }
  };

  const handleSelectCategory = (jsonFileName) => {
    setActiveCategory(jsonFileName);
    computeCategoryProgress(jsonFileName);
    window.selectedCategory = jsonFileName;
    localStorage.setItem('memolandum_saved_stage', jsonFileName);
    
    // Bind styling changes to legacy menu elements so they don't break
    const card = document.querySelector(`.level-card[data-category="${jsonFileName}"]`);
    if (card && typeof window.selectCategory === 'function') {
      window.selectCategory(jsonFileName, card);
    }
    setShowLevelDrawer(false);
  };

  const handleLaunchMode = (shellName) => {
    handleSelectShell(shellName);
    if (typeof window.loadLevel === 'function') {
      window.loadLevel(activeCategory);
    }
  };

  const handleLaunchExam = () => {
    if (typeof window.launchExam === 'function') {
      window.launchExam();
    }
  };

  const handleResume = () => {
    if (!savedStage) return;
    const SECTOR_ORDER = [
      'a1_words.json', 'a2_words.json', 'b1_words.json', 'b2_words.json',
      'phrasal_verbs.json', 'conjunctions.json', 'academic_verbs.json',
      'prepositions.json', 'abstract_adjectives.json'
    ];
    window.resumeLevelIndex = savedLevel - 1;
    window.sessionScore = savedScore;
    const sectorIndex = SECTOR_ORDER.indexOf(savedStage);
    window.sessionLevel = sectorIndex !== -1 ? (sectorIndex + 1) : 1;
    
    if (typeof window.loadLevel === 'function') {
      window.loadLevel(savedStage, true);
    }
  };

  const handleRandomPlay = () => {
    const shells = ['shooter', 'breakout', 'highway', 'wordascent', 'worddrop'];
    const categories = [
      'a1_words.json', 'a2_words.json', 'b1_words.json', 'b2_words.json',
      'phrasal_verbs.json', 'conjunctions.json', 'academic_verbs.json',
      'prepositions.json', 'abstract_adjectives.json'
    ];
    const randomShell = shells[Math.floor(Math.random() * shells.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    setActiveShell(randomShell);
    setActiveCategory(randomCategory);
    computeCategoryProgress(randomCategory);

    if (typeof window.switchGameShell === 'function') {
      window.switchGameShell(randomShell);
    }
    if (typeof window.loadLevel === 'function') {
      window.loadLevel(randomCategory);
    }
  };

  const handleResetDatabase = () => {
    if (confirm(t.resetWarning)) {
      localStorage.removeItem('memolandum_mastery_db');
      localStorage.removeItem('memolandum_saved_stage');
      localStorage.removeItem('memolandum_saved_level');
      localStorage.removeItem('memolandum_saved_score');
      localStorage.removeItem('memolandum_collected_gems');
      localStorage.removeItem('memolandum_high_score');
      
      setSavedStage(null);
      setSavedLevel(1);
      setSavedScore(0);
      setCollectedGems(0);
      setHighScore(0);
      computeCategoryProgress(activeCategory);
      alert(t.resetSuccess);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#0a0f1d] text-white flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* ----------------------------------------------------
          React Dashboard View (Mounted inside main-menu wrapper)
          ---------------------------------------------------- */}
      <div id="main-menu" className={`w-full flex-grow flex flex-col items-center px-4 py-6 overflow-y-auto ${activeTab === 'home' ? '' : 'pb-24'}`}>
        
        {/* Header Section */}
        <header className="w-full max-w-md flex flex-col items-center mb-6">
          <div className="w-full flex justify-between items-center px-2">
            {/* Logo */}
            <div className="flex items-center gap-1.5">
              <span className="text-xl animate-bounce">🕹️</span>
              <h1 className="text-2xl font-black tracking-widest text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]">
                MEMOLANDUM
              </h1>
            </div>
            
            {/* Language Toggle Component */}
            <div className="flex items-center bg-[#181d2e] border border-gray-800 rounded-full p-0.5 w-24 h-8 relative cursor-pointer shadow-inner">
              <button 
                onClick={() => toggleLanguage('TR')} 
                className={`flex-1 text-center text-[10px] font-black z-10 transition-colors duration-200 ${language === 'TR' ? 'text-white' : 'text-gray-500'}`}
              >
                TR
              </button>
              <button 
                onClick={() => toggleLanguage('ENG')} 
                className={`flex-1 text-center text-[10px] font-black z-10 transition-colors duration-200 ${language === 'ENG' ? 'text-white' : 'text-gray-500'}`}
              >
                ENG
              </button>
              {/* Animated selection slider */}
              <div 
                className={`absolute top-0.5 bottom-0.5 w-[44px] bg-cyan-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.8)] ${language === 'ENG' ? 'left-[46px]' : 'left-0.5'}`} 
              />
            </div>
          </div>
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-[3px] mt-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
            {t.subtitle}
          </div>
        </header>

        {/* ----------------------------------------------------
            Tab Content: HOME DASHBOARD
            ---------------------------------------------------- */}
        {activeTab === 'home' && (
          <div className="w-full max-w-md flex flex-col items-center flex-grow">
            
            {/* Resume Mission Panel */}
            {savedStage && (
              <div className="w-full mb-5 px-1 animate-pulse">
                <div className="text-[9px] tracking-[3px] text-yellow-400 font-black mb-1.5 uppercase text-center drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                  {t.resumeTitle}
                </div>
                <button 
                  onClick={handleResume}
                  className="w-full py-3.5 px-4 bg-[#1b1c24] border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 active:scale-[0.98] transition-all rounded-xl font-bold tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.15)] text-xs flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>{t.resumeBtn} <strong className="text-white">{getCategoryDisplayName(savedStage, language)}</strong></span>
                  </span>
                  <span className="bg-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-black text-yellow-300">Lvl {savedLevel}</span>
                </button>
              </div>
            )}

            {/* Horizontal Stats Carousel */}
            <div className="w-full overflow-x-auto flex gap-4 snap-x snap-mandatory scroll-smooth px-1 py-2 mb-6 hide-scrollbar">
              
              {/* Card 1: Levels (Green) */}
              <div 
                onClick={() => setShowLevelDrawer(true)}
                className="snap-center shrink-0 w-[240px] bg-[#0d1f1a]/80 border-2 border-emerald-500/30 rounded-2xl p-4 shadow-[0_0_12px_rgba(16,185,129,0.15)] flex flex-col justify-between cursor-pointer hover:border-emerald-400 active:scale-[0.97] transition-all"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {t.levelCardLabel}
                    </span>
                    <span className="text-xs">🟢</span>
                  </div>
                  <h3 className="text-lg font-black mt-3 text-white truncate drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                    {getCategoryDisplayName(activeCategory, language)}
                  </h3>
                </div>
                <div className="flex justify-between items-center mt-6 pt-2 border-t border-emerald-500/10">
                  <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
                    {t.levelActionText}
                  </span>
                  <svg className="w-3.5 h-3.5 text-emerald-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Main Progress (Orange Gradient) - Slightly Wider */}
              <div className="snap-center shrink-0 w-[270px] bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 shadow-[0_0_20px_rgba(249,115,22,0.35)] flex flex-col justify-between text-white relative overflow-hidden">
                {/* Cyber Matrix BG glow grid effect */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                
                <div className="flex justify-between items-start z-10">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-orange-950/30 px-2.5 py-0.5 rounded-full border border-orange-400/20">
                    {t.progressCardLabel}
                  </span>
                  {/* Glowing Lightning Bolt */}
                  <svg className="w-5 h-5 text-yellow-300 animate-pulse drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <div className="my-4 z-10">
                  <h3 className="text-lg font-black tracking-wide leading-tight line-clamp-1">
                    {getCategoryDisplayName(activeCategory, language)}
                  </h3>
                  <div className="text-[11px] text-orange-200 mt-1 font-bold">
                    {vocabProgress.mastered} / {vocabProgress.total} {t.progressWordsLearned}
                  </div>
                </div>

                <div className="z-10">
                  {/* Progress bar container */}
                  <div className="w-full bg-orange-950/40 rounded-full h-2.5 overflow-hidden border border-orange-400/25">
                    <div 
                      className="bg-yellow-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.95)]"
                      style={{ width: `${vocabProgress.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] text-orange-100 font-extrabold">{vocabProgress.pct}% {t.progressComplete}</span>
                    <span className="text-[9px] text-yellow-300 font-black animate-pulse tracking-wider">{t.progressReady}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Exams (Purple) */}
              <div 
                onClick={handleLaunchExam}
                className="snap-center shrink-0 w-[240px] bg-[#140f24]/80 border-2 border-purple-500/30 rounded-2xl p-4 shadow-[0_0_12px_rgba(168,85,247,0.15)] flex flex-col justify-between cursor-pointer hover:border-purple-400 active:scale-[0.97] transition-all"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      {t.examsCardLabel}
                    </span>
                    <span className="text-xs">🧠</span>
                  </div>
                  <h3 className="text-lg font-black mt-3 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                    {t.examsCardTitle}
                  </h3>
                  <div className="text-[10px] text-purple-400 mt-1 font-bold">
                    88% {t.examsAccuracy}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-2 border-t border-purple-500/10">
                  <span className="text-[9px] text-purple-500 font-bold uppercase tracking-wider">
                    {t.examsActionText}
                  </span>
                  <svg className="w-3.5 h-3.5 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Game Modes Header */}
            <div className="w-full px-2 mb-4 text-left">
              <h2 className="text-sm font-black text-cyan-400 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                {t.gameModesTitle}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                {t.gameModesSubtitle}
              </p>
            </div>

            {/* Game Modes 2-Column Grid */}
            <div className="grid grid-cols-2 gap-4 w-full px-1 pb-36">
              
              {/* Card 1: Shooter (Cyan) */}
              <button 
                onClick={() => handleLaunchMode('shooter')}
                className={`flex flex-col items-center justify-center p-5 bg-[#111625]/90 border-2 rounded-2xl text-center active:scale-95 duration-100 transition-all ${activeShell === 'shooter' ? 'border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.5)]' : 'border-cyan-500/35 hover:border-cyan-400/70 shadow-[0_0_10px_rgba(6,182,212,0.15)]'}`}
              >
                {/* Rocket Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-500/10 mb-3 shadow-[0_0_8px_rgba(6,182,212,0.15)]">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5C17.5 10.5 21 12 21 12S19.5 8.5 17.5 6.5C15.5 4.5 12 1 12 1S8.5 4.5 6.5 6.5C4.5 8.5 1 12 1 12S4.5 10.5 6.5 8.5C8.5 6.5 12 5 12 5S13.5 6.5 15.5 8.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c-2 2-5 3-5 3s1-3 3-5l2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l-3 3v2h2l3-3m-2-2L6 14m8-2l2 2" />
                  </svg>
                </div>
                <h4 className="text-xs font-black tracking-wider text-white">{t.rocketTitle}</h4>
                <p className="text-[8px] text-gray-500 mt-1 leading-tight font-medium">{t.rocketDesc}</p>
              </button>

              {/* Card 2: Breakout (Pink) */}
              <button 
                onClick={() => handleLaunchMode('breakout')}
                className={`flex flex-col items-center justify-center p-5 bg-[#111625]/90 border-2 rounded-2xl text-center active:scale-95 duration-100 transition-all ${activeShell === 'breakout' ? 'border-pink-400 shadow-[0_0_18px_rgba(236,72,153,0.5)]' : 'border-pink-500/35 hover:border-pink-400/70 shadow-[0_0_10px_rgba(236,72,153,0.15)]'}`}
              >
                {/* Puzzle Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-pink-500/10 mb-3 shadow-[0_0_8px_rgba(236,72,153,0.15)]">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 3.5c1.5 0 2.5 1.5 2.5 2.5s-1 2.5-2.5 2.5H12V3.5h2.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 8.5C8 8.5 7 7 7 6s1-2.5 2.5-2.5H12V8.5H9.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12v2.5c0 1.5 1.5 2.5 2.5 2.5S12 16 12 14.5V12H7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 12v2.5c0 1.5-1.5 2.5-2.5 2.5S12 16 12 14.5V12h5z" />
                  </svg>
                </div>
                <h4 className="text-xs font-black tracking-wider text-white">{t.puzzleTitle}</h4>
                <p className="text-[8px] text-gray-500 mt-1 leading-tight font-medium">{t.puzzleDesc}</p>
              </button>

              {/* Card 3: Highway (Yellow) */}
              <button 
                onClick={() => handleLaunchMode('highway')}
                className={`flex flex-col items-center justify-center p-5 bg-[#111625]/90 border-2 rounded-2xl text-center active:scale-95 duration-100 transition-all ${activeShell === 'highway' ? 'border-yellow-400 shadow-[0_0_18px_rgba(234,179,8,0.5)]' : 'border-yellow-500/35 hover:border-yellow-400/70 shadow-[0_0_10px_rgba(234,179,8,0.15)]'}`}
              >
                {/* Race Car Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-yellow-500/10 mb-3 shadow-[0_0_8px_rgba(234,179,8,0.15)]">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18M5 14h14l-2.5-6H7.5L5 14zm3.5-3h6" />
                    <circle cx="7.5" cy="15.5" r="2.5" />
                    <circle cx="16.5" cy="15.5" r="2.5" />
                  </svg>
                </div>
                <h4 className="text-xs font-black tracking-wider text-white">{t.raceTitle}</h4>
                <p className="text-[8px] text-gray-500 mt-1 leading-tight font-medium">{t.raceDesc}</p>
              </button>

              {/* Card 4: Word Ascent (Purple) */}
              <button 
                onClick={() => handleLaunchMode('wordascent')}
                className={`flex flex-col items-center justify-center p-5 bg-[#111625]/90 border-2 rounded-2xl text-center active:scale-95 duration-100 transition-all ${activeShell === 'wordascent' ? 'border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.5)]' : 'border-purple-500/35 hover:border-purple-400/70 shadow-[0_0_10px_rgba(168,85,247,0.15)]'}`}
              >
                {/* Cards Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-500/10 mb-3 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="10" height="14" rx="2" />
                    <rect x="10" y="8" width="10" height="14" rx="2" className="fill-[#111625] opacity-90" />
                  </svg>
                </div>
                <h4 className="text-xs font-black tracking-wider text-white">{t.cardsTitle}</h4>
                <p className="text-[8px] text-gray-500 mt-1 leading-tight font-medium">{t.cardsDesc}</p>
              </button>

              {/* Card 5: Word Drop (Red) */}
              <button 
                onClick={() => handleLaunchMode('worddrop')}
                className={`flex flex-col items-center justify-center p-5 bg-[#111625]/90 border-2 rounded-2xl text-center active:scale-95 duration-100 transition-all ${activeShell === 'worddrop' ? 'border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.5)]' : 'border-red-500/35 hover:border-red-400/70 shadow-[0_0_10px_rgba(239,68,68,0.15)]'}`}
              >
                {/* Joystick Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 mb-3 shadow-[0_0_8px_rgba(239,68,68,0.15)]">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13V5m0 0a2 2 0 100-4 2 2 0 000 4zm-6 8h12v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7z" />
                  </svg>
                </div>
                <h4 className="text-xs font-black tracking-wider text-white">{t.joystickTitle}</h4>
                <p className="text-[8px] text-gray-500 mt-1 leading-tight font-medium">{t.joystickDesc}</p>
              </button>

              {/* Card 6: Exam Blitz (Green) */}
              <button 
                onClick={handleLaunchExam}
                className="flex flex-col items-center justify-center p-5 bg-[#111625]/90 border-2 border-green-500/35 rounded-2xl text-center active:scale-95 duration-100 hover:border-green-400/70 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all shadow-[0_0_10px_rgba(34,197,94,0.15)]"
              >
                {/* Star/Crown Icon */}
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-500/10 mb-3 shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.248.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.176 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.773-.562-.375-1.81.587-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h4 className="text-xs font-black tracking-wider text-white">{t.starTitle}</h4>
                <p className="text-[8px] text-gray-500 mt-1 leading-tight font-medium">{t.starDesc}</p>
              </button>

              {/* Card 7: About Us (Cyan/Purple) */}
              <a 
                href="about.html"
                className="col-span-2 flex items-center justify-center p-4 mt-2 bg-gradient-to-r from-[#111625]/90 to-purple-900/20 border-2 border-cyan-500/30 rounded-xl text-center active:scale-95 duration-100 hover:border-cyan-400/70 shadow-[0_0_10px_rgba(6,182,212,0.15)] transition-all gap-2"
              >
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h4 className="text-xs font-black tracking-wider text-white uppercase">{t.aboutBtn}</h4>
              </a>
            </div>

            {/* Fixed Action Button (Random Play) */}
            <div className="fixed bottom-20 left-0 w-full px-4 z-40 max-w-md left-1/2 -translate-x-1/2">
              <button 
                onClick={handleRandomPlay}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 rounded-2xl font-black tracking-widest text-white text-sm shadow-[0_0_20px_rgba(217,70,239,0.55)] active:shadow-[0_0_25px_rgba(217,70,239,0.8)] hover:brightness-110 active:scale-[0.97] transition-all uppercase flex items-center justify-center gap-2.5 border border-pink-400/25"
              >
                <span>{t.randomPlayBtn}</span>
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            Tab Content: PROGRESS TAB
            ---------------------------------------------------- */}
        {activeTab === 'progress' && (
          <div className="w-full max-w-md flex flex-col items-center flex-grow">
            <div className="w-full text-left px-2 mb-6">
              <h2 className="text-lg font-black text-emerald-400 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                {t.statsTitle}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.statsSubtitle}
              </p>
            </div>

            {/* Mastery Info Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mb-6">
              <div className="bg-[#111625]/90 border border-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
                <span className="text-2xl mb-1">🎓</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{t.totalMastered}</span>
                <span className="text-2xl font-black text-white mt-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                  {vocabProgress.mastered}
                </span>
              </div>
              <div className="bg-[#111625]/90 border border-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
                <span className="text-2xl mb-1">🌌</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{t.masteryLevel}</span>
                <span className="text-lg font-black text-emerald-400 mt-1 uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  CADET III
                </span>
              </div>
              <div className="bg-[#111625]/90 border border-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
                <span className="text-2xl mb-1">💎</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{t.gemsCollected}</span>
                <span className="text-2xl font-black text-cyan-400 mt-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                  {collectedGems}
                </span>
              </div>
              <div className="bg-[#111625]/90 border border-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
                <span className="text-2xl mb-1">📈</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{t.examAvg}</span>
                <span className="text-2xl font-black text-purple-400 mt-1 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                  88%
                </span>
              </div>
            </div>

            {/* Level Progress Breakdown */}
            <div className="w-full bg-[#111625]/95 border border-gray-800 rounded-2xl p-4 shadow-md">
              <h3 className="text-xs font-black tracking-wider text-cyan-400 mb-4 uppercase">{language === 'TR' ? 'SEKTÖR BAZLI GELİŞİM' : 'SECTOR PROGRESS DETAILED'}</h3>
              
              <div className="space-y-4">
                {CATEGORIES.core.map(cat => {
                  const p = typeof window !== 'undefined' ? getCategoryProgressInline(cat.id) : { pct: 0, mastered: 0 };
                  return (
                    <div key={cat.id} className="w-full">
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="text-white truncate">{getCategoryDisplayName(cat.id, language)}</span>
                        <span className="text-gray-400 shrink-0">{p.mastered} / 100</span>
                      </div>
                      <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden border border-gray-800">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            Tab Content: LEADERBOARD TAB
            ---------------------------------------------------- */}
        {activeTab === 'leaderboard' && (
          <div className="w-full max-w-md flex flex-col items-center flex-grow">
            <div className="w-full text-left px-2 mb-6">
              <h2 className="text-lg font-black text-yellow-400 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                {t.leaderboardTitle}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.leaderboardSubtitle}
              </p>
            </div>

            {/* Leaderboard Table */}
            <div className="w-full bg-[#111625]/95 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="flex bg-gray-900/80 px-4 py-3 text-[10px] font-black tracking-widest text-cyan-400 uppercase border-b border-gray-850">
                <span className="w-16 text-center">{t.rank}</span>
                <span className="flex-grow text-left">{t.pilot}</span>
                <span className="w-20 text-right">{t.score}</span>
              </div>
              
              <div className="divide-y divide-gray-850">
                {[
                  { rank: '🥇 01', pilot: 'VORTEX_HUNTER', score: 25400, isSelf: false },
                  { rank: '🥈 02', pilot: 'NEON_CHASER', score: 21850, isSelf: false },
                  { rank: '🥉 03', pilot: 'VOID_RUNNER', score: 18900, isSelf: false },
                  { rank: '⚔️ 04', pilot: 'YOU (CADET)', score: Math.max(highScore, 8500), isSelf: true },
                  { rank: '👾 05', pilot: 'ASTRO_BLASTER', score: 7200, isSelf: false }
                ].map((row, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center px-4 py-3.5 text-xs font-bold ${row.isSelf ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-300'}`}
                  >
                    <span className="w-16 text-center font-mono">{row.rank}</span>
                    <span className="flex-grow truncate tracking-wider">{row.pilot}</span>
                    <span className={`w-20 text-right font-mono ${row.isSelf ? 'text-cyan-400 font-extrabold' : 'text-yellow-400'}`}>
                      {row.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            Tab Content: PROFILE TAB
            ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="w-full max-w-md flex flex-col items-center flex-grow">
            <div className="w-full text-left px-2 mb-6">
              <h2 className="text-lg font-black text-purple-400 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                {t.profileTitle}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.profileSubtitle}
              </p>
            </div>

            {/* Profile Card */}
            <div className="w-full bg-[#111625]/95 border border-gray-800 rounded-2xl p-6 flex flex-col items-center shadow-lg mb-6">
              {/* Astronaut Avatar Icon */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-1 shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-4">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-4xl">
                  👨‍🚀
                </div>
              </div>

              <h3 className="text-lg font-black tracking-widest text-white mb-0.5">CADET_ADEM</h3>
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/25">
                LEVEL {savedLevel} PILOT
              </span>

              {/* Pilot Specs Grid */}
              <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-850 text-xs font-bold">
                <div className="flex justify-between items-center bg-gray-900/50 p-2.5 rounded-xl border border-gray-850">
                  <span className="text-gray-500">GEMS</span>
                  <span className="text-cyan-400">💎 {collectedGems}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-900/50 p-2.5 rounded-xl border border-gray-850">
                  <span className="text-gray-500">HI-SCORE</span>
                  <span className="text-yellow-400">🏆 {highScore}</span>
                </div>
              </div>
            </div>

            {/* About Us Button */}
            <a 
              href="about.html"
              className="w-full py-3.5 mb-4 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 hover:border-cyan-400/50 active:scale-[0.98] transition-all text-white rounded-xl font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {t.aboutBtn}
            </a>

            {/* Reset Button */}
            <button 
              onClick={handleResetDatabase}
              className="w-full py-3.5 bg-red-950/20 border border-red-500/35 hover:bg-red-500/15 active:scale-[0.98] transition-all text-red-500 rounded-xl font-bold tracking-widest text-xs uppercase"
            >
              {t.resetData}
            </button>
          </div>
        )}

      </div>

      {/* ----------------------------------------------------
          Level Selection Bottom Drawer/Modal
          ---------------------------------------------------- */}
      {showLevelDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-[#0d1222] border-2 border-cyan-500/30 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-[0_-10px_25px_rgba(6,182,212,0.2)]">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-850 flex justify-between items-start sticky top-0 bg-[#0d1222]/95 backdrop-blur-md z-10">
              <div>
                <h3 className="text-md font-black tracking-wide text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  {t.selectLevelTitle}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                  {t.selectLevelSubtitle}
                </p>
              </div>
              <button 
                onClick={() => setShowLevelDrawer(false)}
                className="text-xs font-bold text-gray-400 hover:text-white bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800"
              >
                {t.closeBtn}
              </button>
            </div>

            {/* Drawer Category Tabs */}
            <div className="flex px-4 py-3 gap-3">
              <button 
                onClick={() => setLevelsTab('core')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all border ${levelsTab === 'core' ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.45)]' : 'bg-gray-900 text-gray-400 border-gray-800'}`}
              >
                {t.coreLevelsTab}
              </button>
              <button 
                onClick={() => setLevelsTab('special')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all border ${levelsTab === 'special' ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.45)]' : 'bg-gray-900 text-gray-400 border-gray-800'}`}
              >
                {t.specializedTab}
              </button>
            </div>

            {/* Category Cards List */}
            <div className="px-4 pb-6 space-y-3">
              {(levelsTab === 'core' ? CATEGORIES.core : CATEGORIES.special).map(cat => {
                const isSelected = activeCategory === cat.id;
                return (
                  <div 
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border flex flex-col relative overflow-hidden ${isSelected ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-[#111625] border-gray-850 hover:border-cyan-500/40'}`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />}
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-black tracking-wide ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        {getCategoryDisplayName(cat.id, language)}
                      </span>
                      <span className="text-[9px] font-black tracking-widest text-pink-500 uppercase">
                        {isSelected ? t.connectedBtn : t.connectBtn}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5 leading-normal">{cat.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          Bottom Navigation Bar
          ---------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#0d1222]/95 border-t border-gray-850 backdrop-blur-md pt-3 pb-5 px-6 max-w-md mx-auto left-1/2 -translate-x-1/2 flex justify-between items-center text-center">
        
        {/* Nav Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'home' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-gray-500 hover:text-gray-300 transition-colors'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-wider">{t.navHome}</span>
        </button>

        {/* Nav Progress */}
        <button 
          onClick={() => setActiveTab('progress')}
          className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'progress' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-gray-500 hover:text-gray-300 transition-colors'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-wider">{t.navProgress}</span>
        </button>

        {/* Nav Leaderboard */}
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'leaderboard' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-gray-500 hover:text-gray-300 transition-colors'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-wider">{t.navLeaderboard}</span>
        </button>

        {/* Nav Profile */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'profile' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-gray-500 hover:text-gray-300 transition-colors'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-wider">{t.navProfile}</span>
        </button>
      </nav>

      {/* ----------------------------------------------------
          Game DOM Overlays & Shell Mount Points
          (Required to exist in DOM for legacy canvas compatibility)
          ---------------------------------------------------- */}
      <div id="game-container" className="hidden relative w-full h-full max-w-[500px] bg-black overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.85)] md:h-[95vh] md:rounded-[20px] md:border md:border-[rgba(0,240,255,0.25)] md:shadow-[0_0_50px_rgba(0,240,255,0.15)]">
        {/* Retro Filter Overlay */}
        <div className="scanlines"></div>

        {/* HUD Overlay */}
        <div id="hud" className="hidden">
          <div className="hud-item">
            <span className="hud-label">SHIELDS</span>
            <span id="hud-shields">🛡️ 🛡️ 🛡️</span>
          </div>
          <div className="hud-item">
            <span id="level-label" className="hud-label">LEVEL</span>
            <span id="level-val" className="hud-value">1</span>
          </div>
          <div className="hud-item">
            <span id="mastered-label" className="hud-label">MASTERED</span>
            <span id="mastered-val" className="hud-value">0/10</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">GEMS</span>
            <span id="gems-val" className="hud-value">💎 0</span>
          </div>
          <div className="hud-item">
            <span id="score-label" className="hud-label">SCORE</span>
            <span id="score-val" className="hud-value">0</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">HIGH SCORE</span>
            <span id="high-val" className="hud-value">0</span>
          </div>
          <button id="btn-pause" className="hud-pause-btn" aria-label="Pause Game">⏸</button>
        </div>

        {/* HTML5 Canvas */}
        <canvas id="gameCanvas" className="hidden"></canvas>

        {/* Start Game UI Overlay */}
        <div id="start-screen" className="screen-overlay hidden">
          <h1 className="game-title">MEMOLANDUM</h1>
          <div className="game-subtitle">CYBER VOCABULARY RETRO SHOTTER</div>
          
          <div className="instructions-box">
            <p>🛸 Move left/right with <strong>Arrow Keys / A & D</strong> or virtual arrows.</p>
            <p>⚡ Fire lasers with <strong>Spacebar</strong> or the virtual <strong>FIRE</strong> button.</p>
            <p>👾 Blast falling meteors displaying English words.</p>
            <p>💡 Memorize the <strong>neon green Turkish meaning</strong> flashed upon destruction!</p>
            <p>🛡️ Do not let meteors pass! Protect your shields.</p>
          </div>

          <button id="start-btn" className="glow-btn btn-cyan">START SYSTEM</button>
        </div>

        {/* Game Over UI Overlay */}
        <div id="game-over-screen" className="screen-overlay hidden">
          <h2 className="game-title" style={{color: 'var(--glow-magenta)', textShadow: '0 0 15px rgba(255, 0, 85, 0.6)', animation: 'none'}}>SYSTEM FAULT</h2>
          <div className="game-subtitle" style={{color: '#ffffff', textShadow: 'none', fontSize: '12px', marginBottom: '20px'}}>SHIELDS DEPRECIATED</div>

          <div className="score-summary">
            Your Score: <span id="final-score">0</span>
          </div>

          {/* Educational Feedback Module */}
          <div className="words-learned-container">
            <div className="words-learned-title">Vocabulary Encountered This Run</div>
            <ul id="learned-list" className="word-list">
              {/* Populated by JavaScript */}
            </ul>
          </div>

          <button id="restart-btn" className="glow-btn btn-magenta">RESTART SYSTEM</button>
          <button id="menu-btn" className="glow-btn btn-cyan" style={{marginTop: '12px', width: '100%', maxWidth: '200px'}}>MAIN MENU</button>
        </div>

        {/* Victory UI Overlay */}
        <div id="victory-screen" className="screen-overlay hidden">
          <h2 className="game-title" style={{color: 'var(--glow-green)', textShadow: '0 0 15px rgba(57, 255, 20, 0.6)', animation: 'none'}}>SECTOR CLEARED</h2>
          <div className="game-subtitle" style={{color: '#ffffff', textShadow: 'none', fontSize: '12px', marginBottom: '20px'}}>ALL VOCABULARY MASTERED</div>

          <div className="score-summary">
            Final Score: <span id="victory-score">0</span>
          </div>

          {/* Educational Feedback Module */}
          <div className="words-learned-container">
            <div className="words-learned-title">Mastered Vocabulary</div>
            <ul id="victory-learned-list" className="word-list">
              {/* Populated by JavaScript */}
            </ul>
          </div>

          <button id="victory-next-btn" className="glow-btn btn-yellow hidden" style={{marginBottom: '12px', width: '100%', maxWidth: '200px'}}>NEXT SECTOR</button>
          <button id="victory-restart-btn" className="glow-btn btn-green" style={{width: '100%', maxWidth: '200px'}}>RESTART SYSTEM</button>
          <button id="victory-menu-btn" className="glow-btn btn-cyan" style={{marginTop: '12px', width: '100%', maxWidth: '200px'}}>MAIN MENU</button>
        </div>

        {/* Stage Celebration UI Overlay */}
        <div id="celebration-screen" className="screen-overlay hidden">
          <div style={{fontSize: '50px', marginBottom: '20px'}}>🏆</div>
          <h2 className="game-title" style={{color: 'var(--glow-green)', textShadow: '0 0 15px rgba(57, 255, 20, 0.6)', fontSize: '28px', lineHeight: '1.3', marginBottom: '10px'}}>SECTOR FULLY DECRYPTED</h2>
          <div id="celebration-text" className="game-subtitle" style={{color: '#ffffff', textShadow: 'none', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6', maxWidth: '360px'}}>
            Tebrikler! A1 Seviyesini Tamamladın.<br />A2 Seviyesi Başlıyor...
          </div>
          <div style={{fontFamily: 'var(--font-header)', fontSize: '12px', color: 'var(--glow-yellow)', marginBottom: '25px', letterSpacing: '2px'}}>
            NEXT SECTOR LOADING IN <span id="celebration-countdown">4</span>s
          </div>
          <button id="celebration-skip-btn" className="glow-btn btn-yellow" style={{width: '100%', maxWidth: '220px'}}>START NOW</button>
        </div>

        {/* Exam Results UI Overlay */}
        <div id="exam-results-screen" className="screen-overlay hidden">
          <h2 className="game-title" style={{color: 'var(--glow-yellow)', textShadow: '0 0 15px rgba(255, 234, 0, 0.6)', animation: 'none'}}>EXAM COMPLETED</h2>
          <div className="game-subtitle" style={{color: '#ffffff', textShadow: 'none', fontSize: '12px', marginBottom: '20px'}}>ADAPTIVE LEARNING EVALUATION</div>

          <div className="score-summary" style={{fontSize: '18px', marginBottom: '20px'}}>
            Result Score: <span id="exam-score">0/10</span>
          </div>

          <div className="words-learned-container" style={{maxHeight: '250px', width: '100%', maxWidth: '380px', textAlign: 'left'}}>
            <div className="words-learned-title" style={{textAlign: 'center'}}>Tested Vocabulary Details</div>
            <ul id="exam-details-list" className="word-list" style={{flexDirection: 'column', alignItems: 'stretch', gap: '6px', padding: '0 5px'}}>
              {/* Populated by JavaScript */}
            </ul>
          </div>

          <div style={{display: 'flex', gap: '10px', width: '100%', maxWidth: '380px', marginTop: '15px', justifyContent: 'center'}}>
            <button id="exam-retry-btn" className="glow-btn btn-yellow" style={{flex: 1, padding: '10px', fontSize: '11px', fontFamily: 'var(--font-header)', fontWeight: 700, letterSpacing: '1px'}}>RETRY SAME WORDS</button>
            <button id="exam-new-btn" className="glow-btn btn-green" style={{flex: 1, padding: '10px', fontSize: '11px', fontFamily: 'var(--font-header)', fontWeight: 700, letterSpacing: '1px'}}>NEW WORDS</button>
          </div>
          <button id="exam-close-btn" className="glow-btn btn-cyan" style={{width: '100%', maxWidth: '380px', marginTop: '12px'}}>RETURN TO MENU</button>
        </div>

        {/* Mobile Virtual Controls */}
        <div className="controls-container hidden">
          <div className="d-pad">
            <button id="btn-left" className="control-btn" aria-label="Move Left">◀</button>
            <button id="btn-right" className="control-btn" aria-label="Move Right">▶</button>
          </div>
          <div className="fire-pad">
            <button id="btn-fire" className="fire-btn">FIRE</button>
          </div>
        </div>

        {/* Pause UI Overlay */}
        <div id="pause-screen" className="screen-overlay hidden">
          <h2 className="game-title" style={{color: 'var(--glow-yellow)', textShadow: '0 0 15px rgba(255, 234, 0, 0.6)', animation: 'none'}}>SYSTEM PAUSED</h2>
          <div className="game-subtitle" style={{color: '#ffffff', textShadow: 'none', fontSize: '11px', marginBottom: '30px', letterSpacing: '1px'}}>TRAINING TEMPORARILY SUSPENDED</div>
          
          <button id="resume-btn" className="glow-btn btn-yellow" style={{marginBottom: '12px', width: '100%', maxWidth: '200px'}}>RESUME SYSTEM</button>
          <button id="pause-exam-btn" className="glow-btn btn-green" style={{marginBottom: '12px', width: '100%', maxWidth: '200px'}}>START EXAM</button>
          <button id="pause-restart-btn" className="glow-btn btn-magenta" style={{marginBottom: '12px', width: '100%', maxWidth: '200px'}}>RESTART SYSTEM</button>
          <button id="pause-menu-btn" className="glow-btn btn-cyan" style={{width: '100%', maxWidth: '200px'}}>MAIN MENU</button>
        </div>

        {/* Loading Screen Overlay */}
        <div id="loading-screen" className="screen-overlay hidden">
          <div className="spinner"></div>
          <h2 className="game-title" style={{fontSize: '24px', color: 'var(--glow-cyan)'}}>LOADING SECTOR DATA</h2>
          <div className="game-subtitle" style={{color: '#ffffff', textShadow: 'none', fontSize: '11px', marginTop: '5px'}}>ESTABLISHING QUANTUM LINK...</div>
        </div>
      </div>

      {/* ----------------------------------------------------
          Legacy Shell and Speed Selectors Mounted Hidden
          (Prevents DOM lookup errors in existing scripts)
          ---------------------------------------------------- */}
      <div className="hidden" aria-hidden="true">
        <button id="shell-shooter" onClick={() => setSelectedSpeed('normal')}></button>
        <button id="shell-breakout"></button>
        <button id="shell-worddrop"></button>
        <button id="shell-highway"></button>
        <button id="shell-wordascent"></button>
        <button id="shell-invaders"></button>
        <button id="speed-slow"></button>
        <button id="speed-normal" className="active"></button>
        <button id="speed-fast"></button>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// Internal Helpers for inline progress check in tabs
// ----------------------------------------------------
function getCategoryProgressInline(categoryName) {
  try {
    const dbStr = localStorage.getItem('memolandum_mastery_db');
    const db = dbStr ? JSON.parse(dbStr) : {};
    
    let words = [];
    if (window.FALLBACK_DATA && window.FALLBACK_DATA[categoryName]) {
      words = window.FALLBACK_DATA[categoryName];
    } else {
      return { pct: 0, mastered: 0 };
    }

    let mastered = 0;
    words.forEach(w => {
      const key = (w.word || w.en || "").toString().toUpperCase();
      if (key && db[key] && db[key].totalHits >= 3) {
        mastered++;
      }
    });

    const total = words.length;
    const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { pct, mastered };
  } catch (e) {
    return { pct: 0, mastered: 0 };
  }
}
