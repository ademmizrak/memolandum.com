"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useT } from "../../lib/i18n/LocaleProvider";

/* ── Desteklenen diller ve içerikleri ─────────────────────────────────────── */
const ALL_LANGS = [
  {
    code: "tr", flag: "🇹🇷", name: "Türkçe",
    title: "Neden Memolandum?",
    intro: "memolandum.com, geleneksel ve sıkıcı öğrenme metotlarını geride bırakarak kalıcı hafıza yönetimini küresel bir oyun ekosistemine dönüştüren yeni nesil bir platformdur. Nörobilim, bilişsel psikoloji ve oyun teknolojilerinin kesişiminde; beyin potansiyelini maximuma taşıyoruz.",
    science: [
      { t: "01. Subliminal & Örtük Öğrenme", b: "Beyin, bilinçli fark etmediğin uyaranları da işler. Oyuna odaklanırken kelimeler zihinde örtük olarak pekişir." },
      { t: "02. Aralıklı Tekrar", b: "Algoritmalar, unutma eşiğine yaklaştığın kelimeleri geri getirerek uzun süreli belleğe taşır." },
      { t: "03. Çift Kodlama Teorisi", b: "Metni dinamik görsel uyaranlarla birleştiririz; sadece okumak değil, görmek ve tepki vermek sinaptik bağları güçlendirir." },
      { t: "04. Flow Teorisi & Oyunlaştırma", b: "Zorluk seviyesi anlık kelime hakimiyetine göre uyarlanır; öğrenme yük değil sürdürülebilir odak haline gelir." },
      { t: "05. Aktif Hatırlama", b: "Pasif okumak yerine arcade mekaniğiyle bilgiyi içeriden çekmeye zorlarız; kalıcı öğrenme böyle gerçekleşir." },
    ],
    vision: "Memolandum, sisteme eklenen her yeni dille küresel bir dil edinme merkezine dönüşmektedir. Sen de sıfırdan başlayıp dünya dillerinde ustalaşabilirsin.",
  },
  {
    code: "en", flag: "🇬🇧", name: "English",
    title: "Why Memolandum?",
    intro: "memolandum.com is a next-generation platform turning memory management into a global game ecosystem — leaving boring drills behind. At the intersection of neuroscience, cognitive psychology, and game technology, we maximize your brain's learning potential.",
    science: [
      { t: "01. Subliminal & Implicit Learning", b: "The brain processes stimuli you don't consciously notice. While you focus on the game, words consolidate implicitly in long-term memory." },
      { t: "02. Spaced Repetition", b: "Algorithms bring back words near the forgetting threshold and move them into long-term storage, making retention effortless." },
      { t: "03. Dual Coding Theory", b: "We pair text with dynamic visual stimuli. You don't just read — you see, react, and activate spatial memory simultaneously." },
      { t: "04. Flow Theory & Gamification", b: "Difficulty adapts to your live vocabulary mastery so learning feels focused and sustainable, never overwhelming." },
      { t: "05. Active Recall", b: "Instead of passive reading, arcade mechanics force you to retrieve knowledge from within — strengthening synaptic connections." },
    ],
    vision: "Memolandum is becoming a global multi-language acquisition hub. Every language you learn stretches cognitive boundaries — start from zero and build mastery.",
  },
  {
    code: "de", flag: "🇩🇪", name: "Deutsch",
    title: "Warum Memolandum?",
    intro: "memolandum.com ist eine Plattform der nächsten Generation, die Gedächtnistraining in ein globales Spiel-Ökosystem verwandelt. An der Schnittstelle von Neurowissenschaft, kognitiver Psychologie und Spieltechnologie maximieren wir dein Lernpotenzial.",
    science: [
      { t: "01. Subliminal & implizites Lernen", b: "Das Gehirn verarbeitet auch unbewusst wahrgenommene Reize. Während du spielst, festigen sich Wörter implizit im Langzeitgedächtnis." },
      { t: "02. Verteiltes Lernen (Spaced Repetition)", b: "Algorithmen bringen Wörter kurz vor dem Vergessen zurück und überführen sie dauerhaft ins Langzeitgedächtnis." },
      { t: "03. Theorie der dualen Codierung", b: "Wir verbinden Text mit dynamischen visuellen Reizen. Du liest nicht nur — du siehst, reagierst und aktivierst räumliches Gedächtnis." },
      { t: "04. Flow-Theorie & Gamification", b: "Der Schwierigkeitsgrad passt sich deinem aktuellen Wortschatzstand an, sodass Lernen fokussiert und nachhaltig bleibt." },
      { t: "05. Aktives Erinnern", b: "Statt passivem Lesen zwingen Arcade-Mechaniken dich, Wissen aktiv abzurufen — das stärkt neuronale Verbindungen nachhaltig." },
    ],
    vision: "Memolandum wächst mit jeder neuen Sprache zu einem globalen Sprachlernzentrum. Starte bei null und erarbeite dir Meisterschaft in den Sprachen der Welt.",
  },
  {
    code: "fr", flag: "🇫🇷", name: "Français",
    title: "Pourquoi Memolandum?",
    intro: "memolandum.com est une plateforme de nouvelle génération qui transforme la gestion de la mémoire en un écosystème de jeu mondial. À l'intersection des neurosciences, de la psychologie cognitive et des technologies du jeu, nous maximisons votre potentiel d'apprentissage.",
    science: [
      { t: "01. Apprentissage Subliminal & Implicite", b: "Le cerveau traite aussi les stimuli que vous ne percevez pas consciemment. En jouant, les mots se consolident implicitement dans la mémoire à long terme." },
      { t: "02. Répétition Espacée", b: "Des algorithmes rappellent les mots proches du seuil d'oubli et les transfèrent dans la mémoire à long terme de façon permanente." },
      { t: "03. Théorie du Double Codage", b: "Nous associons le texte à des stimuli visuels dynamiques. Vous ne lisez pas seulement — vous voyez, réagissez et activez la mémoire spatiale." },
      { t: "04. Théorie du Flow & Gamification", b: "La difficulté s'adapte à votre maîtrise du vocabulaire en temps réel, rendant l'apprentissage concentré et durable." },
      { t: "05. Rappel Actif", b: "Au lieu de lire passivement, les mécaniques d'arcade vous forcent à récupérer les connaissances de l'intérieur — renforçant les connexions synaptiques." },
    ],
    vision: "Memolandum devient un hub mondial d'acquisition de langues avec chaque nouvelle langue ajoutée. Commencez de zéro et maîtrisez les langues du monde entier.",
  },
  {
    code: "es", flag: "🇪🇸", name: "Español",
    title: "¿Por qué Memolandum?",
    intro: "memolandum.com es una plataforma de nueva generación que convierte la gestión de la memoria en un ecosistema de juego global. En la intersección de la neurociencia, la psicología cognitiva y la tecnología del juego, maximizamos tu potencial de aprendizaje.",
    science: [
      { t: "01. Aprendizaje Subliminal & Implícito", b: "El cerebro también procesa estímulos que no percibes conscientemente. Mientras juegas, las palabras se consolidan implícitamente en la memoria a largo plazo." },
      { t: "02. Repetición Espaciada", b: "Los algoritmos traen de vuelta palabras cerca del umbral del olvido y las transfieren de forma permanente a la memoria a largo plazo." },
      { t: "03. Teoría de la Codificación Dual", b: "Combinamos texto con estímulos visuales dinámicos. No solo lees — ves, reaccionas y activas la memoria espacial al mismo tiempo." },
      { t: "04. Teoría del Flujo & Gamificación", b: "La dificultad se adapta a tu dominio actual del vocabulario, haciendo que el aprendizaje sea enfocado y sostenible, nunca abrumador." },
      { t: "05. Recuerdo Activo", b: "En lugar de leer pasivamente, las mecánicas de arcade te obligan a recuperar el conocimiento desde dentro — fortaleciendo las conexiones sinápticas." },
    ],
    vision: "Memolandum se está convirtiendo en un hub global de adquisición de idiomas con cada nuevo idioma agregado. Empieza desde cero y construye tu maestría en los idiomas del mundo.",
  },
  {
    code: "ja", flag: "🇯🇵", name: "日本語",
    title: "なぜMemolandumなのか？",
    intro: "memolandum.comは、退屈な従来の学習法を打破し、記憶管理をグローバルなゲームエコシステムへと変換する次世代プラットフォームです。神経科学、認知心理学、ゲームテクノロジーの交差点で、あなたの学習ポテンシャルを最大化します。",
    science: [
      { t: "01. 潜在的・暗示的学習", b: "脳は意識的に気づかない刺激も処理します。ゲームに集中しながら、言葉は長期記憶に暗示的に定着します。" },
      { t: "02. 間隔反復法", b: "アルゴリズムが忘却の閾値に近づいた単語を呼び戻し、長期記憶へと永続的に転送します。" },
      { t: "03. デュアルコーディング理論", b: "テキストを動的な視覚刺激と組み合わせます。読むだけでなく、見て反応し、空間記憶を活性化します。" },
      { t: "04. フロー理論とゲーミフィケーション", b: "難易度はリアルタイムの語彙習熟度に適応し、学習が集中的かつ持続可能なものになります。" },
      { t: "05. アクティブリコール", b: "受動的な読書の代わりに、アーケードメカニクスが知識を内側から引き出すよう強制します。" },
    ],
    vision: "Memolandumは新しい言語が追加されるたびにグローバルな言語習得ハブへと成長しています。ゼロから始めて世界の言語をマスターしましょう。",
  },
  {
    code: "zh", flag: "🇨🇳", name: "中文",
    title: "为什么选择Memolandum？",
    intro: "memolandum.com是下一代平台，将记忆管理转变为全球游戏生态系统，抛开枯燥的传统学习方式。在神经科学、认知心理学和游戏技术的交汇处，我们最大化您的学习潜力。",
    science: [
      { t: "01. 潜意识与隐式学习", b: "大脑也处理您未有意识地注意到的刺激。在专注游戏的同时，单词会在长期记忆中隐式巩固。" },
      { t: "02. 间隔重复", b: "算法在接近遗忘阈值时召回单词，并将其永久转移到长期记忆中。" },
      { t: "03. 双重编码理论", b: "我们将文本与动态视觉刺激相结合。您不只是阅读——您看到、反应，并同时激活空间记忆。" },
      { t: "04. 心流理论与游戏化", b: "难度根据您的实时词汇掌握程度调整，使学习保持专注和可持续，从不令人不知所措。" },
      { t: "05. 主动回忆", b: "不是被动阅读，而是街机游戏机制迫使您从内部检索知识——加强突触连接。" },
    ],
    vision: "随着每种新语言的加入，Memolandum正在成为全球多语言习得中心。从零开始，掌握世界各种语言。",
  },
  {
    code: "ar", flag: "🇸🇦", name: "العربية",
    title: "لماذا Memolandum؟",
    intro: "memolandum.com منصة الجيل القادم التي تحوّل إدارة الذاكرة إلى نظام بيئي للألعاب العالمية، متخلّصةً من أساليب التعلّم التقليدية الممللة. عند تقاطع علم الأعصاب وعلم النفس المعرفي وتكنولوجيا الألعاب، نعظّم إمكاناتك التعليمية.",
    science: [
      { t: "01. التعلم تحت الواعي والضمني", b: "يعالج الدماغ المحفّزات التي لا تلاحظها واعيًا. أثناء تركيزك في اللعبة، تتثبّت الكلمات ضمنيًا في الذاكرة طويلة المدى." },
      { t: "02. التكرار المتباعد", b: "تعيد الخوارزميات استدعاء الكلمات عند اقترابها من عتبة النسيان وتنقلها بصورة دائمة إلى الذاكرة طويلة المدى." },
      { t: "03. نظرية الترميز المزدوج", b: "نجمع النص بمحفّزات بصرية ديناميكية. لا تقرأ فحسب — بل ترى وتتفاعل وتنشّط الذاكرة المكانية في آنٍ واحد." },
      { t: "04. نظرية التدفق والتلعيب", b: "تتكيّف درجة الصعوبة مع مستوى إتقانك الحالي للمفردات، مما يجعل التعلم مركّزًا ومستدامًا." },
      { t: "05. الاستذكار النشط", b: "بدلًا من القراءة السلبية، تجبرك ميكانيكيات الألعاب على استرجاع المعرفة من الداخل — مما يعزّز الروابط العصبية." },
    ],
    vision: "يتحوّل Memolandum مع كل لغة جديدة تُضاف إليه إلى مركز عالمي لاكتساب اللغات. ابدأ من الصفر وابنِ إتقانك بلغات العالم.",
  },
];

const SCIENCE_ACCENTS = ["#22d3ee", "#facc15", "#4ade80", "#a78bfa", "#f472b6"];

export default function AboutClient() {
  const t = useT();
  const [activeLang, setActiveLang] = useState("tr");
  const [expandedCard, setExpandedCard] = useState(null);

  const lang = ALL_LANGS.find((l) => l.code === activeLang) || ALL_LANGS[0];
  const isRTL = activeLang === "ar";

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-200">
      <Header />

      {/* ── Hero Section ─────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Ambient glow bg */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,211,238,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(168,85,247,0.08) 0%, transparent 60%)",
        }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-white transition-colors text-sm font-bold tracking-wider uppercase mb-10"
            style={{ textDecoration: "none" }}
          >
            ← {t("common.back")}
          </Link>

          {/* Title */}
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-mono font-bold tracking-widest text-cyan-400 border border-cyan-400/30 rounded-full px-3 py-1 mb-4 bg-cyan-400/5">
              🧬 SCIENCE · MISSION · VISION
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4" style={{
              background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 50%, #f472b6 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              MEMOLANDUM
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Dünya genelinde öğrencilere bilimsel temelli, oyun destekli dil öğrenme deneyimi sunuyoruz.
              <br />
              <span className="text-slate-500 text-sm">Building the world&apos;s most engaging vocabulary acquisition ecosystem.</span>
            </p>
          </div>

          {/* ── Language Picker ─────────────────────────────────── */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {ALL_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setActiveLang(l.code)}
                className="lang-pill"
                data-active={activeLang === l.code}
                style={{
                  padding: "7px 16px",
                  borderRadius: 999,
                  border: activeLang === l.code ? "1px solid rgba(34,211,238,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  background: activeLang === l.code ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
                  color: activeLang === l.code ? "#22d3ee" : "#94a3b8",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Language-Specific Content ─────────────────────────── */}
      <div
        key={activeLang}
        className="max-w-4xl mx-auto px-4 pb-20"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ animation: "fadeInUp 0.4s ease" }}
      >
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{lang.flag}</span>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white m-0">{lang.title}</h2>
            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">{lang.name}</span>
          </div>
        </div>

        {/* Intro */}
        <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-6 mb-10 backdrop-blur-sm">
          <p className="text-slate-300 text-base leading-relaxed m-0" style={{ fontSize: 15 }}>{lang.intro}</p>
        </div>

        {/* Science Cards */}
        <h3 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-5">
          ⚗️ {activeLang === "tr" ? "Bilimsel Temeller" : "Scientific Foundations"}
        </h3>
        <div className="grid gap-4 mb-12">
          {lang.science.map((card, i) => {
            const accent = SCIENCE_ACCENTS[i % SCIENCE_ACCENTS.length];
            const isOpen = expandedCard === `${activeLang}-${i}`;
            return (
              <div
                key={i}
                onClick={() => setExpandedCard(isOpen ? null : `${activeLang}-${i}`)}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${accent}22`,
                  background: isOpen
                    ? `linear-gradient(135deg, ${accent}0d 0%, rgba(15,23,42,0.9) 100%)`
                    : "rgba(15,23,42,0.6)",
                  padding: "16px 20px",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  boxShadow: isOpen ? `0 0 20px ${accent}15` : "none",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 style={{ color: accent, fontWeight: 800, fontSize: 14, margin: 0, letterSpacing: "0.02em" }}>
                    {card.t}
                  </h4>
                  <span style={{ color: accent, fontSize: 18, flexShrink: 0, transition: "transform 0.25s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                    ›
                  </span>
                </div>
                {isOpen && (
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "10px 0 0 0" }}>
                    {card.b}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Vision */}
        <div style={{
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(34,211,238,0.05) 100%)",
          border: "1px solid rgba(168,85,247,0.2)",
          padding: "24px 28px",
        }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🌌</span>
            <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
              {activeLang === "tr" ? "Küresel Vizyon" : "Global Vision"}
            </span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed m-0">{lang.vision}</p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {[
            { n: "8+", label: activeLang === "tr" ? "Desteklenen Dil" : "Languages" },
            { n: "6", label: activeLang === "tr" ? "Arcade Oyun" : "Arcade Games" },
            { n: "AI", label: "Gemini Powered" },
            { n: "∞", label: activeLang === "tr" ? "Kelime Seti" : "Word Sets" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center rounded-xl py-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="text-2xl font-black text-transparent bg-clip-text" style={{
                backgroundImage: "linear-gradient(135deg, #22d3ee, #a78bfa)"
              }}>{s.n}</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── All Languages Strip ───────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-center text-xs font-mono text-slate-600 uppercase tracking-widest mb-6">
            Available in / Şu dillerde mevcut
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {ALL_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setActiveLang(l.code); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = "#f1f5f9"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                onMouseOut={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lang-pill:hover {
          background: rgba(34, 211, 238, 0.08) !important;
          color: #e2e8f0 !important;
          border-color: rgba(34, 211, 238, 0.2) !important;
        }
      `}} />
    </div>
  );
}
