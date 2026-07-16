"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useT } from "../../lib/i18n/LocaleProvider";

/* ─────────────────────────────────────────────────────────────────────────────
   Bilimsel İçerik — 8 dil, araştırma & bilim insanı atıflarıyla
───────────────────────────────────────────────────────────────────────────── */

const SCIENCE_POINTS = [
  {
    id: "subliminal",
    accent: "#22d3ee",
    icon: "🧠",
    labels: {
      tr: "01. Subliminal & Örtük Öğrenme",
      en: "01. Subliminal & Implicit Learning",
      de: "01. Subliminal- & Implizites Lernen",
      fr: "01. Apprentissage Subliminal & Implicite",
      es: "01. Aprendizaje Subliminal & Implícito",
      ja: "01. 潜在的・暗示的学習",
      zh: "01. 潜意识与隐式学习",
      ar: "01. التعلم تحت الواعي والضمني",
    },
    theory: {
      tr: "Araştırmacı Arthur Reber'in 1967'de keşfettiği örtük öğrenme teorisi; insan beyninin farkında olmadığı uyaranlar aracılığıyla karmaşık örüntüleri sessizce içselleştirebildiğini kanıtlar.",
      en: "Researcher Arthur Reber's 1967 discovery of implicit learning theory proves that the human brain can silently internalize complex patterns through stimuli it isn't consciously aware of.",
      de: "Arthur Rebers 1967 entdeckte Theorie des impliziten Lernens beweist, dass das menschliche Gehirn komplexe Muster durch unbewusste Reize still verinnerlichen kann.",
      fr: "La théorie de l'apprentissage implicite, découverte par Arthur Reber en 1967, prouve que le cerveau humain peut intérioriser silencieusement des schémas complexes à travers des stimuli non conscients.",
      es: "La teoría del aprendizaje implícito, descubierta por Arthur Reber en 1967, demuestra que el cerebro humano puede internalizar silenciosamente patrones complejos a través de estímulos de los que no es consciente.",
      ja: "アーサー・レーバーが1967年に発見した暗示的学習理論は、人間の脳が意識的に気づかない刺激を通じて複雑なパターンを静かに内在化できることを証明しています。",
      zh: "研究员阿瑟·雷伯1967年发现的隐式学习理论证明，人类大脑可以通过无意识刺激静默地内化复杂模式。",
      ar: "تُثبت نظرية التعلم الضمني التي اكتشفها الباحث آرثر ريبر عام 1967 أن الدماغ البشري قادر على استيعاب أنماط معقدة بصمت عبر مثيرات غير واعية.",
    },
    solution: {
      tr: "memolandum.com'un oyun motorlarında, siz ana hedefe odaklanmışken periferik vizyon alanınızda hedef dildeki kelime kalıpları beyninize servis edilir. Skor üretmeye çalışırken, beyniniz arka planda dili doğal kodlarıyla öğrenir.",
      en: "In memolandum.com's game engines, while you focus on the main target, word patterns in the target language are served to your brain in your peripheral vision. While trying to score, your brain learns the language with its natural codes in the background.",
      de: "In den Spielmotoren von memolandum.com werden Ihnen Wortmuster der Zielsprache im peripheren Sichtfeld präsentiert, während Sie sich auf das Hauptziel konzentrieren. Beim Punktesammeln lernt Ihr Gehirn die Sprache mit ihren natürlichen Codes.",
      fr: "Dans les moteurs de jeu de memolandum.com, pendant que vous vous concentrez sur la cible principale, des modèles de mots dans la langue cible sont transmis à votre cerveau dans votre vision périphérique. En essayant de marquer des points, votre cerveau apprend la langue en arrière-plan.",
      es: "En los motores de juego de memolandum.com, mientras te concentras en el objetivo principal, los patrones de palabras en el idioma objetivo se sirven a tu cerebro en tu visión periférica. Mientras intentas hacer puntuación, tu cerebro aprende el idioma con sus códigos naturales en segundo plano.",
      ja: "memolandum.comのゲームエンジンでは、メインターゲットに集中している間、周辺視野でターゲット言語の単語パターンが脳に提供されます。スコアを出しながら、脳はバックグラウンドで言語を自然なコードで学習します。",
      zh: "在memolandum.com的游戏引擎中，当您专注于主要目标时，目标语言的单词模式会在您的周边视野中传递给您的大脑。在尝试得分的同时，您的大脑在后台用其自然代码学习语言。",
      ar: "في محركات الألعاب لـ memolandum.com، بينما تركّز على الهدف الرئيسي، تُغذَّى الأنماط اللغوية للغة المستهدفة إلى دماغك عبر مجال الرؤية المحيطية. وأثناء سعيك لتسجيل النقاط، يتعلم دماغك اللغة بشفراتها الطبيعية في الخلفية.",
    },
  },
  {
    id: "ebbinghaus",
    accent: "#facc15",
    icon: "📈",
    labels: {
      tr: "02. Ebbinghaus Unutma Eğrisi & Aralıklı Tekrar",
      en: "02. Ebbinghaus Forgetting Curve & Spaced Repetition",
      de: "02. Ebbinghaus'sche Vergessenskurve & Verteiltes Lernen",
      fr: "02. Courbe de l'Oubli d'Ebbinghaus & Répétition Espacée",
      es: "02. Curva del Olvido de Ebbinghaus & Repetición Espaciada",
      ja: "02. エビングハウスの忘却曲線と間隔反復",
      zh: "02. 艾宾浩斯遗忘曲线与间隔重复",
      ar: "02. منحنى النسيان لإيبنغهاوس والتكرار المتباعد",
    },
    theory: {
      tr: "1885'te psikolog Hermann Ebbinghaus tarafından keşfedilen Unutma Eğrisi, yeni öğrenilen bilgilerin tekrar edilmediği takdirde saatler içinde %60'ından fazlasının kaybolduğunu gösterir. Wozniak & Leitner'ın geliştirdiği aralıklı tekrar yöntemi bu eğriye karşı en güçlü silah olarak kabul edilir.",
      en: "The Forgetting Curve, discovered by psychologist Hermann Ebbinghaus in 1885, shows that over 60% of newly learned information is lost within hours if not repeated. The spaced repetition method developed by Wozniak & Leitner is considered the most powerful weapon against this curve.",
      de: "Die 1885 vom Psychologen Hermann Ebbinghaus entdeckte Vergessenskurve zeigt, dass über 60% neu gelernter Informationen innerhalb von Stunden verloren gehen, wenn sie nicht wiederholt werden. Die von Wozniak & Leitner entwickelte Methode des verteilten Lernens gilt als die wirksamste Gegenmaßnahme.",
      fr: "La courbe de l'oubli, découverte par le psychologue Hermann Ebbinghaus en 1885, montre que plus de 60% des informations nouvellement apprises sont perdues en quelques heures si elles ne sont pas répétées. La méthode de répétition espacée développée par Wozniak & Leitner est considérée comme l'arme la plus puissante contre cette courbe.",
      es: "La Curva del Olvido, descubierta por el psicólogo Hermann Ebbinghaus en 1885, muestra que más del 60% de la información recién aprendida se pierde en horas si no se repite. El método de repetición espaciada desarrollado por Wozniak & Leitner se considera el arma más poderosa contra esta curva.",
      ja: "1885年に心理学者ヘルマン・エビングハウスが発見した忘却曲線は、新しく学んだ情報の60%以上が繰り返しなしで数時間以内に失われることを示しています。ウォズニアックとライトナーが開発した間隔反復法がこの曲線に対する最も強力な武器とされています。",
      zh: "1885年心理学家赫尔曼·艾宾浩斯发现的遗忘曲线表明，如果不重复，超过60%的新学信息会在几小时内丢失。沃兹尼亚克和莱特纳开发的间隔重复法被认为是对抗这条曲线最有力的武器。",
      ar: "تُظهر منحنى النسيان، الذي اكتشفه عالم النفس هيرمان إيبنغهاوس عام 1885، أن أكثر من 60% من المعلومات المتعلمة حديثًا تُفقد في غضون ساعات إن لم تُكرَّر. تُعدّ طريقة التكرار المتباعد التي طوّرها وزنياك وليتنر أقوى سلاح ضد هذا المنحنى.",
    },
    solution: {
      tr: "memolandum.com algoritmaları, bir kelimeyi tam unutmak üzere olduğunuz o kritik 'kırılma anını' hesaplar. Oyun modülleri, bu kelimeleri tam zamanında karşınıza çıkararak bilginin kısa süreli bellekten kalıcı hafızaya (long-term memory) transfer edilmesini sağlar.",
      en: "memolandum.com algorithms calculate that critical 'breaking point' when you are about to completely forget a word. The game modules present these words to you right on time, ensuring that the information is transferred from short-term memory to long-term memory.",
      de: "Die Algorithmen von memolandum.com berechnen den kritischen 'Kipppunkt', an dem Sie ein Wort vollständig vergessen würden. Die Spielmodule präsentieren diese Wörter genau zur richtigen Zeit und sorgen so für den Transfer vom Kurzzeit- ins Langzeitgedächtnis.",
      fr: "Les algorithmes de memolandum.com calculent ce 'point critique' où vous êtes sur le point d'oublier complètement un mot. Les modules de jeu vous présentent ces mots au bon moment, assurant le transfert de la mémoire à court terme vers la mémoire à long terme.",
      es: "Los algoritmos de memolandum.com calculan ese 'punto crítico' cuando estás a punto de olvidar completamente una palabra. Los módulos de juego te presentan estas palabras justo a tiempo, asegurando que la información sea transferida de la memoria a corto plazo a la memoria a largo plazo.",
      ja: "memolandum.comのアルゴリズムは、単語を完全に忘れそうになる臨界「ブレークポイント」を計算します。ゲームモジュールはこれらの単語をちょうどよいタイミングで提示し、情報が短期記憶から長期記憶に転送されることを保証します。",
      zh: "memolandum.com的算法计算出您即将完全忘记某个单词的关键'临界点'。游戏模块在恰当的时机向您呈现这些单词，确保信息从短期记忆转移到长期记忆。",
      ar: "تحسب خوارزميات memolandum.com 'نقطة الانكسار' الحرجة التي على وشك أن تنسى فيها الكلمة نهائيًا. تعرض وحدات الألعاب هذه الكلمات في الوقت المناسب تمامًا، مما يضمن انتقال المعلومات من الذاكرة قصيرة المدى إلى الذاكرة طويلة المدى.",
    },
  },
  {
    id: "paivio",
    accent: "#4ade80",
    icon: "🎨",
    labels: {
      tr: "03. İkili Kodlama Teorisi — Allan Paivio",
      en: "03. Dual-Coding Theory — Allan Paivio",
      de: "03. Duale Kodierungstheorie — Allan Paivio",
      fr: "03. Théorie du Double Codage — Allan Paivio",
      es: "03. Teoría de la Codificación Dual — Allan Paivio",
      ja: "03. デュアルコーディング理論 — アラン・パイヴィオ",
      zh: "03. 双重编码理论 — 阿兰·佩维奥",
      ar: "03. نظرية الترميز المزدوج — ألان بايفيو",
    },
    theory: {
      tr: "Allan Paivio'nun İkili Kodlama Teorisi (1971), insan beyninin bilgiyi hem görsel hem de sözel kanallardan ayrı ayrı işlediğini ortaya koyar. Bu iki kanaldan aynı anda bilgi girdiğinde, akılda kalıcılık oranı tek kanalla kıyaslandığında katlanarak artar.",
      en: "Allan Paivio's Dual-Coding Theory (1971) reveals that the human brain processes information separately from both visual and verbal channels. When information enters from both channels simultaneously, the retention rate increases exponentially compared to a single channel.",
      de: "Allan Paivios Theorie der dualen Kodierung (1971) zeigt, dass das menschliche Gehirn Informationen sowohl über visuelle als auch über verbale Kanäle separat verarbeitet. Wenn Informationen gleichzeitig über beide Kanäle eingehen, steigt die Behaltenrate exponentiell an.",
      fr: "La théorie du double codage d'Allan Paivio (1971) révèle que le cerveau humain traite les informations séparément à partir des canaux visuels et verbaux. Lorsque les informations entrent simultanément par les deux canaux, le taux de rétention augmente de façon exponentielle.",
      es: "La Teoría de la Codificación Dual de Allan Paivio (1971) revela que el cerebro humano procesa información por separado desde canales tanto visuales como verbales. Cuando la información entra por ambos canales simultáneamente, la tasa de retención aumenta exponencialmente.",
      ja: "アラン・パイヴィオの双対符号化理論（1971年）は、人間の脳が視覚チャンネルと言語チャンネルの両方から別々に情報を処理することを明らかにしています。両方のチャンネルから同時に情報が入ると、保持率が指数関数的に増加します。",
      zh: "阿兰·佩维奥的双重编码理论（1971年）揭示了人类大脑分别通过视觉和语言两个通道处理信息。当信息同时从两个通道进入时，保留率呈指数级增长。",
      ar: "تكشف نظرية الترميز المزدوج لألان بايفيو (1971) أن الدماغ البشري يعالج المعلومات بشكل منفصل عبر قنوات بصرية ولفظية. عندما تدخل المعلومات من كلا القناتين في آنٍ واحد، يرتفع معدل الاحتفاظ بها بصورة أسية.",
    },
    solution: {
      tr: "Platformumuzdaki özel HTML5 Canvas tabanlı görsel oyun motorları, metinsel veriyi dinamik görsel uyaranlarla birleştirir. Sadece okumaz, aynı zamanda görür, tepki verir ve mekansal hafızanızı (spatial memory) tetiklersiniz.",
      en: "Our special HTML5 Canvas-based visual game engines combine textual data with dynamic visual stimuli. You not only read but also see, react, and trigger your spatial memory.",
      de: "Unsere speziellen auf HTML5-Canvas basierenden visuellen Spielmotoren kombinieren Textdaten mit dynamischen visuellen Reizen. Sie lesen nicht nur, sondern sehen, reagieren und aktivieren Ihr räumliches Gedächtnis.",
      fr: "Nos moteurs de jeu visuels spéciaux basés sur HTML5 Canvas combinent des données textuelles avec des stimuli visuels dynamiques. Vous ne lisez pas seulement, mais voyez également, réagissez et déclenchez votre mémoire spatiale.",
      es: "Nuestros motores de juego visuales especiales basados en HTML5 Canvas combinan datos textuales con estímulos visuales dinámicos. No solo lees, sino que también ves, reaccionas y activas tu memoria espacial.",
      ja: "HTML5 Canvasベースの特別な視覚ゲームエンジンは、テキストデータと動的な視覚刺激を組み合わせます。読むだけでなく、見て、反応し、空間記憶を起動させます。",
      zh: "我们基于HTML5 Canvas的特殊视觉游戏引擎将文本数据与动态视觉刺激相结合。您不只是阅读，还会看到、反应并激活您的空间记忆。",
      ar: "تجمع محركات الألعاب المرئية الخاصة بنا المستندة إلى HTML5 Canvas بين البيانات النصية والمحفّزات البصرية الديناميكية. لا تقرأ فحسب، بل ترى وتتفاعل وتُنشّط ذاكرتك المكانية أيضًا.",
    },
  },
  {
    id: "csikszentmihalyi",
    accent: "#a78bfa",
    icon: "🌊",
    labels: {
      tr: "04. Akış Teorisi & Oyunlaştırma — Csikszentmihalyi",
      en: "04. Flow Theory & Gamification — Csikszentmihalyi",
      de: "04. Flow-Theorie & Gamification — Csikszentmihalyi",
      fr: "04. Théorie du Flow & Gamification — Csikszentmihalyi",
      es: "04. Teoría del Flow & Gamificación — Csikszentmihalyi",
      ja: "04. フロー理論 & ゲーミフィケーション — チクセントミハイ",
      zh: "04. 心流理论 & 游戏化 — 契克森米哈伊",
      ar: "04. نظرية التدفق والتلعيب — تشيكسينتميهالي",
    },
    theory: {
      tr: "Mihaly Csikszentmihalyi tarafından ortaya konan Akış (Flow) Teorisi, bir bireyin beceri düzeyi ile karşılaştığı zorluk dengelendiğinde 'pürüzsüz bir odaklanma' evresine girdiğini kanıtlar. Bu evrede dopamin salgısı artar, zaman kavramı yok olur ve öğrenme çarpanı katlanır.",
      en: "The Flow Theory put forward by Mihaly Csikszentmihalyi proves that when an individual's skill level and the difficulty they face are balanced, they enter a phase of 'smooth focus.' In this phase, dopamine release increases, the sense of time disappears, and the learning multiplier compounds.",
      de: "Die von Mihaly Csikszentmihalyi entwickelte Flow-Theorie beweist, dass eine Person eine Phase des 'reibungslosen Fokus' erreicht, wenn ihr Fähigkeitsniveau und der Schwierigkeitsgrad ausgewogen sind. In dieser Phase steigt die Dopaminausschüttung, das Zeitgefühl schwindet und der Lernmultiplikator vervielfacht sich.",
      fr: "La théorie du Flow mise en avant par Mihaly Csikszentmihalyi prouve que lorsque le niveau de compétence d'un individu et la difficulté à laquelle il fait face sont équilibrés, il entre dans une phase de 'concentration fluide.' Dans cette phase, la libération de dopamine augmente, la notion du temps disparaît et le multiplicateur d'apprentissage se compose.",
      es: "La Teoría del Flow presentada por Mihaly Csikszentmihalyi prueba que cuando el nivel de habilidad de un individuo y la dificultad que enfrenta están equilibrados, entra en una fase de 'enfoque fluido.' En esta fase, la liberación de dopamina aumenta, el sentido del tiempo desaparece y el multiplicador de aprendizaje se compone.",
      ja: "ミハイ・チクセントミハイが提唱するフロー理論は、個人のスキルレベルと直面する困難のバランスが取れているとき、「スムーズな集中」の段階に入ることを証明しています。この段階でドーパミン分泌が増加し、時間感覚が消え、学習乗数が増加します。",
      zh: "米哈里·契克森米哈伊提出的心流理论证明，当个人技能水平与面临的困难平衡时，会进入'顺畅专注'的阶段。在这个阶段，多巴胺释放增加，时间感消失，学习乘数复合增长。",
      ar: "تُثبت نظرية التدفق التي طرحها ميهالي تشيكسينتميهالي أن الفرد يدخل مرحلة 'التركيز السلس' عندما يتوازن مستوى مهارته مع درجة الصعوبة التي يواجهها. في هذه المرحلة يزداد إفراز الدوبامين، ويختفي الإحساس بالوقت، ويتضاعف معامل التعلم.",
    },
    solution: {
      tr: "Oyun modüllerimiz, kullanıcının anlık kelime hakimiyetine göre dinamik olarak zorlaşır veya kolaylaşır. Bu sayede beyin dopamin salınımını dengede tutarak öğrenme sürecini bir 'yük' olarak değil, sürdürülebilir bir 'pozitif bağımlılık' olarak algılar.",
      en: "Our game modules dynamically become harder or easier according to the user's instant word mastery. This way, the brain keeps dopamine release balanced and perceives the learning process not as a 'burden' but as a sustainable 'positive addiction.'",
      de: "Unsere Spielmodule werden dynamisch schwerer oder leichter, je nach dem momentanen Wortschatz-Kenntnisstand des Nutzers. So hält das Gehirn die Dopaminausschüttung ausgeglichen und nimmt den Lernprozess nicht als 'Belastung', sondern als nachhaltige 'positive Sucht' wahr.",
      fr: "Nos modules de jeu deviennent dynamiquement plus difficiles ou plus faciles selon la maîtrise instantanée des mots de l'utilisateur. Ainsi, le cerveau maintient la libération de dopamine équilibrée et perçoit le processus d'apprentissage non comme un 'fardeau' mais comme une 'addiction positive' durable.",
      es: "Nuestros módulos de juego se vuelven dinámicamente más difíciles o más fáciles según el dominio instantáneo de palabras del usuario. De esta manera, el cerebro mantiene equilibrada la liberación de dopamina y percibe el proceso de aprendizaje no como una 'carga' sino como una 'adicción positiva' sostenible.",
      ja: "ゲームモジュールはユーザーの即時語彙習熟度に応じて動的に難しくなったり簡単になったりします。これにより、脳はドーパミン分泌を均衡に保ち、学習プロセスを「負担」としてではなく、持続可能な「ポジティブな依存性」として認識します。",
      zh: "我们的游戏模块根据用户即时词汇掌握程度动态变难或变简单。这样，大脑保持多巴胺释放平衡，将学习过程视为可持续的「正向依赖」而非「负担」。",
      ar: "تصبح وحدات ألعابنا أصعب أو أسهل ديناميكيًا وفقًا لمستوى إتقان المستخدم الفوري للمفردات. وبهذا يُبقي الدماغ إفراز الدوبامين متوازنًا ويرى في عملية التعلم 'إدمانًا إيجابيًا' مستدامًا لا 'عبئًا'.",
    },
  },
  {
    id: "recall",
    accent: "#f472b6",
    icon: "⚡",
    labels: {
      tr: "05. Aktif Hatırlama (Active Recall)",
      en: "05. Active Recall",
      de: "05. Aktives Erinnern (Active Recall)",
      fr: "05. Rappel Actif (Active Recall)",
      es: "05. Recuerdo Activo (Active Recall)",
      ja: "05. アクティブリコール",
      zh: "05. 主动回忆",
      ar: "05. الاستذكار النشط",
    },
    theory: {
      tr: "Roediger & Karpicke'nin 2006 yılında Science dergisinde yayımlanan araştırması, 'test etkisi'ni (testing effect) bilimsel olarak kanıtladı: Beyin bilgiyi pasif biçimde okuduğunda değil, aktif olarak geri çağırmaya zorlandığında güçlü sinaptik bağlar inşa eder. Bu strateji pasif çalışmaya kıyasla %50'ye varan öğrenme artışı sağlar.",
      en: "Roediger & Karpicke's 2006 research published in Science proved the 'testing effect' scientifically: The brain builds strong synaptic connections not when passively reading information, but when forced to actively recall it. This strategy provides up to 50% learning increase compared to passive study.",
      de: "Die 2006 in Science veröffentlichte Forschung von Roediger & Karpicke bewies den 'Testeffekt' wissenschaftlich: Das Gehirn baut starke synaptische Verbindungen nicht beim passiven Lesen, sondern wenn es gezwungen wird, Informationen aktiv abzurufen. Diese Strategie bietet bis zu 50% Lernzuwachs im Vergleich zu passivem Lernen.",
      fr: "La recherche de Roediger & Karpicke publiée dans Science en 2006 a prouvé scientifiquement l''effet de test': Le cerveau construit de solides connexions synaptiques non pas lors de la lecture passive, mais lorsqu'il est forcé de rappeler activement les informations. Cette stratégie offre jusqu'à 50% d'augmentation de l'apprentissage par rapport à l'étude passive.",
      es: "La investigación de Roediger & Karpicke publicada en Science en 2006 demostró científicamente el 'efecto de prueba': El cerebro construye fuertes conexiones sinápticas no cuando lee información pasivamente, sino cuando se le obliga a recordarla activamente. Esta estrategia proporciona hasta un 50% de aumento en el aprendizaje en comparación con el estudio pasivo.",
      ja: "2006年にScience誌に掲載されたロディガーとカーピッケの研究は「テスト効果」を科学的に証明しました：脳は受動的に情報を読むのではなく、積極的に思い出すよう強いられたときに強いシナプス結合を構築します。この戦略は受動的学習と比較して最大50%の学習向上を提供します。",
      zh: "罗迪格和卡尔皮克2006年发表在《科学》杂志上的研究科学地证明了'测试效应'：大脑不是在被动阅读信息时，而是在被迫主动回忆时建立强大的突触连接。与被动学习相比，这种策略可提供高达50%的学习增长。",
      ar: "أثبت بحث رودجر وكاربيكي المنشور في مجلة Science عام 2006 'أثر الاختبار' علميًا: يبني الدماغ روابط عصبية قوية لا حين يقرأ المعلومات بشكل سلبي، بل حين يُضطرّ إلى استدعائها بنشاط. توفّر هذه الاستراتيجية زيادة في التعلم تصل إلى 50% مقارنة بالدراسة السلبية.",
    },
    solution: {
      tr: "memolandum.com size kelimeleri ezberletmez; arcade mekanikleriyle sizi o bilgiyi refleksif olarak geri çağırmaya (Active Recall) zorlar. Skor üretme ve zamana karşı yarışma içgüdüsü, nöral yolları hızlandırır.",
      en: "memolandum.com doesn't make you memorize words; with arcade mechanics, it forces you to reflexively recall that information (Active Recall). The instinct to score and race against time accelerates neural pathways.",
      de: "memolandum.com lässt Sie keine Wörter auswendig lernen; mit Arcade-Mechaniken zwingt es Sie, diese Informationen reflexartig abzurufen (Active Recall). Der Instinkt zu punkten und gegen die Zeit zu kämpfen beschleunigt neuronale Bahnen.",
      fr: "memolandum.com ne vous fait pas mémoriser des mots ; avec les mécaniques d'arcade, il vous force à rappeler réflexivement ces informations (Active Recall). L'instinct de marquer des points et de courir contre la montre accélère les voies neuronales.",
      es: "memolandum.com no te hace memorizar palabras; con mecánicas de arcade, te obliga a recordar reflexivamente esa información (Active Recall). El instinto de puntuar y competir contra el tiempo acelera las vías neuronales.",
      ja: "memolandum.comは単語を暗記させるのではなく、アーケードメカニクスを使って反射的にその情報をリコール（アクティブリコール）するよう強います。スコアを出し、時間と競争する本能が神経経路を加速させます。",
      zh: "memolandum.com不会让您死记硬背单词；通过街机游戏机制，它迫使您反射性地回忆那些信息（主动回忆）。得分和与时间赛跑的本能加速了神经通路。",
      ar: "لا يجعلك memolandum.com تحفظ الكلمات عن ظهر قلب؛ بل يُرغمك بميكانيكيات الألعاب على استدعاء تلك المعلومات بشكل انعكاسي (الاستذكار النشط). يُسرّع غريزة تسجيل النقاط والتسابق مع الوقت المسارات العصبية.",
    },
  },
  {
    id: "cognitive",
    accent: "#fb923c",
    icon: "🔗",
    labels: {
      tr: "06. Bilişsel Ağlar vs. Yapay Zeka Asistanları",
      en: "06. Cognitive Networks vs. AI Translation Assistants",
      de: "06. Kognitive Netzwerke vs. KI-Übersetzungsassistenten",
      fr: "06. Réseaux Cognitifs vs. Assistants de Traduction IA",
      es: "06. Redes Cognitivas vs. Asistentes de Traducción IA",
      ja: "06. 認知ネットワーク対AI翻訳アシスタント",
      zh: "06. 认知网络与AI翻译助手",
      ar: "06. الشبكات المعرفية مقابل مساعدي الترجمة بالذكاء الاصطناعي",
    },
    theory: {
      tr: "Sürekli dış çevirmene (AI, sözlük) yaslanmak, 'bilişsel boşaltma' (cognitive offloading) yaratır; dil işleme kasları körelir. Anderson & Reder'ın araştırmaları, zorlu ortamlarda kendi bilişsel ağlarından üretilen dilin, yardımlı dile kıyasla çok daha güçlü sinaptik izler bıraktığını ortaya koyar.",
      en: "Continuously relying on external translators (AI, dictionaries) creates 'cognitive offloading'; language-processing muscles atrophy. Research by Anderson & Reder reveals that language produced from one's own cognitive networks in challenging environments leaves far stronger synaptic traces compared to assisted language.",
      de: "Die ständige Abhängigkeit von externen Übersetzern (KI, Wörterbücher) erzeugt 'kognitives Auslagern'; die Sprachverarbeitungsmuskeln verkümmern. Forschungen von Anderson & Reder zeigen, dass Sprache, die in herausfordernden Umgebungen aus den eigenen kognitiven Netzwerken produziert wird, weitaus stärkere synaptische Spuren hinterlässt.",
      fr: "Le fait de s'appuyer continuellement sur des traducteurs externes (IA, dictionnaires) crée un 'déchargement cognitif'; les muscles de traitement du langage s'atrophient. Les recherches d'Anderson & Reder révèlent que le langage produit à partir de ses propres réseaux cognitifs dans des environnements difficiles laisse des traces synaptiques bien plus fortes.",
      es: "Depender continuamente de traductores externos (IA, diccionarios) crea una 'descarga cognitiva'; los músculos de procesamiento del lenguaje se atrofian. La investigación de Anderson & Reder revela que el lenguaje producido desde las propias redes cognitivas en entornos desafiantes deja huellas sinápticas mucho más fuertes.",
      ja: "外部翻訳者（AI、辞書）に常に頼ることは「認知オフローディング」を生み出します。言語処理の筋肉が萎縮します。アンダーソンとレーダーの研究は、困難な環境で自分の認知ネットワークから生成された言語が、支援された言語と比較してはるかに強いシナプス痕跡を残すことを明らかにしています。",
      zh: "持续依赖外部翻译工具（AI、字典）会产生'认知卸载'；语言处理肌肉萎缩。安德森和雷德的研究揭示，在挑战性环境中从自己的认知网络产生的语言比辅助语言留下更强的突触痕迹。",
      ar: "يُولّد الاعتماد المستمر على المترجمات الخارجية (الذكاء الاصطناعي، المعاجم) 'إفراغًا معرفيًا'؛ تضمر عضلات معالجة اللغة. تكشف أبحاث أندرسون وريدر أن اللغة المنتجة من الشبكات المعرفية الذاتية في البيئات الصعبة تترك آثارًا عصبية أقوى بكثير مقارنة باللغة المُساعَدة.",
    },
    solution: {
      tr: "memolandum.com'da AI çeviri, büyük baskı altında çalışan bir yedek sigortadır — koltuk değneği değil. Platform, sizi önce kendi bilişsel ağlarınızı devreye sokarak düşünmeye, sonra ödüllendirilmeye koşullar; dil bir refleks haline gelene kadar.",
      en: "On memolandum.com, AI translation is a backup safety net that works under great pressure — not a crutch. The platform conditions you to first activate your own cognitive networks to think, then be rewarded; until the language becomes a reflex.",
      de: "Auf memolandum.com ist die KI-Übersetzung ein Sicherheitsnetz unter großem Druck — keine Krücke. Die Plattform konditioniert Sie, zuerst Ihre eigenen kognitiven Netzwerke zu aktivieren, dann belohnt zu werden; bis die Sprache zum Reflex wird.",
      fr: "Sur memolandum.com, la traduction IA est un filet de sécurité qui fonctionne sous grande pression — pas une béquille. La plateforme vous conditionne à d'abord activer vos propres réseaux cognitifs pour penser, puis être récompensé; jusqu'à ce que la langue devienne un réflexe.",
      es: "En memolandum.com, la traducción IA es una red de seguridad de respaldo que funciona bajo gran presión — no una muleta. La plataforma te condiciona a primero activar tus propias redes cognitivas para pensar, luego ser recompensado; hasta que el idioma se convierta en un reflejo.",
      ja: "memolandum.comでは、AI翻訳は大きなプレッシャー下で機能するバックアップセーフティネットであり、松葉杖ではありません。プラットフォームは、まず自分の認知ネットワークを活性化して考え、次に報酬を得るよう条件づけます。言語が反射になるまで。",
      zh: "在memolandum.com上，AI翻译是在巨大压力下工作的后备安全网——而非拐杖。该平台条件训练您首先激活自己的认知网络来思考，然后得到奖励；直到语言成为反射。",
      ar: "في memolandum.com، تُمثّل الترجمة بالذكاء الاصطناعي شبكة أمان احتياطية تعمل تحت ضغط كبير — لا عُكّازًا. تُهيّئك المنصة أولًا لتنشيط شبكاتك المعرفية الخاصة والتفكير، ثم تُكافئك؛ حتى تصبح اللغة انعكاسًا تلقائيًا.",
    },
  },
];

const ALL_LANGS = [
  {
    code: "tr", flag: "🇹🇷", name: "Türkçe",
    intro: "memolandum.com, geleneksel ve sıkıcı öğrenme metotlarını geride bırakarak kalıcı hafıza yönetimini küresel bir oyun ekosistemine dönüştüren yeni nesil bir platformdur. Nörobilim, bilişsel psikoloji ve oyun teknolojilerinin kesişiminde çalışıyoruz.",
    vision: "Öğrendiğiniz her yeni dil, dünya bilişim ve iş ekosisteminde size yeni bir kapı açar. memolandum.com'un bilimsel altyapısıyla bir dili bitirip diğerine geçebilir, bilişsel sınırlarınızı esnetebilir ve kişisel gelişiminizi global standartların üzerine çıkarabilirsiniz. Tıpkı sıfır noktasından başlayan atari piksellerinin bugün dünyayı yönetmesi gibi, siz de sıfırdan başlayarak dünya dillerine hakim olacak ve geleceğinizi kendiniz inşa edeceksiniz.",
    whyTitle: "Neden memolandum.com?",
    whyItems: [
      { bold: "Eşik Altı (Subliminal) Güç:", text: "Oyun oynarken farkında olmadan, örtük öğrenme mekanizmalarıyla kalıcı dil edinimi." },
      { bold: "Genişleyen Arcade Kütüphanesi:", text: "6 oyunla sınırlı kalmayan, sürekli büyüyen retro oyun modülleri." },
      { bold: "Küresel Dil Havuzu:", text: "Zaman içinde eklenecek tüm dünya dilleriyle entelektüel ve profesyonel yaşamı domine etme fırsatı." },
      { bold: "Kalıcı Kelime Edinimi:", text: "Günde sadece 10 dakika oynayarak, geleneksel yöntemlere göre %50'ye varan daha kalıcı öğrenme." },
      { bold: "Maksimum Odaklanma:", text: "Sıkıcı flashcard'lar yerine, 90'ların atari salonlarındaki o yüksek odaklanmayı bilimsel algoritmalarla yakalayın." },
    ],
    scienceLabel: "Bilimsel Temeller",
    theoryLabel: "📖 Teorik Dayanak",
    solutionLabel: "🎮 Çözümümüz",
    visionLabel: "Küresel Vizyon",
    whyLabel: "Neden memolandum.com?",
  },
  {
    code: "en", flag: "🇬🇧", name: "English",
    intro: "memolandum.com is a next-generation platform leaving behind boring traditional learning methods and transforming permanent memory management into a global game ecosystem. We operate at the intersection of neuroscience, cognitive psychology, and game technology.",
    vision: "Every new language you learn opens a new door for you in the global tech and business ecosystem. With memolandum.com's scientific infrastructure, you can finish one language and move on to the next, stretch your cognitive boundaries, and raise your personal development above global standards. Just as arcade pixels starting from ground zero rule the world today, you will start from scratch and master world languages.",
    whyTitle: "Why memolandum.com?",
    whyItems: [
      { bold: "Subliminal Power:", text: "Permanent language acquisition through implicit learning mechanisms while playing, without even realizing it." },
      { bold: "Ever-Expanding Arcade Library:", text: "Retro game modules constantly growing beyond 6 games." },
      { bold: "Global Language Pool:", text: "The opportunity to dominate intellectual and professional life with all world languages to be added over time." },
      { bold: "Permanent Vocabulary Acquisition:", text: "Up to 50% more permanent learning compared to traditional methods by playing just 10 minutes a day." },
      { bold: "Maximum Focus:", text: "Scientific algorithms that capture that high focus of 90s arcade halls instead of boring flashcards." },
    ],
    scienceLabel: "Scientific Foundations",
    theoryLabel: "📖 Theory",
    solutionLabel: "🎮 Our Solution",
    visionLabel: "Global Vision",
    whyLabel: "Why memolandum.com?",
  },
  {
    code: "de", flag: "🇩🇪", name: "Deutsch",
    intro: "memolandum.com ist eine Plattform der nächsten Generation, die traditionelle und langweilige Lernmethoden hinter sich lässt und das dauerhafte Gedächtnismanagement in ein globales Spiel-Ökosystem verwandelt. Wir arbeiten an der Schnittstelle von Neurowissenschaft, kognitiver Psychologie und Spieltechnologie.",
    vision: "Jede neue Sprache, die Sie lernen, öffnet Ihnen eine neue Tür im globalen Technologie- und Geschäftsökosystem. Mit der wissenschaftlichen Infrastruktur von memolandum.com können Sie eine Sprache abschließen und zur nächsten übergehen, Ihre kognitiven Grenzen erweitern und Ihre persönliche Entwicklung auf globale Standards heben.",
    whyTitle: "Warum memolandum.com?",
    whyItems: [
      { bold: "Subliminale Kraft:", text: "Dauerhafter Spracherwerb durch implizite Lernmechanismen beim Spielen, ohne es zu merken." },
      { bold: "Ständig wachsende Arcade-Bibliothek:", text: "Retro-Spielmodule, die über 6 Spiele hinaus wachsen." },
      { bold: "Globaler Sprachpool:", text: "Die Chance, intellektuelles und berufliches Leben mit allen Weltsprachen zu dominieren." },
      { bold: "Dauerhafter Wortschatzerwerb:", text: "Bis zu 50% dauerhafteres Lernen im Vergleich zu traditionellen Methoden." },
      { bold: "Maximale Konzentration:", text: "Wissenschaftliche Algorithmen, die die hohe Konzentration der Arcade-Hallen der 90er reproduzieren." },
    ],
    scienceLabel: "Wissenschaftliche Grundlagen",
    theoryLabel: "📖 Theorie",
    solutionLabel: "🎮 Unsere Lösung",
    visionLabel: "Globale Vision",
    whyLabel: "Warum memolandum.com?",
  },
  {
    code: "fr", flag: "🇫🇷", name: "Français",
    intro: "memolandum.com est une plateforme de nouvelle génération qui laisse derrière les méthodes d'apprentissage traditionnelles et ennuyeuses, transformant la gestion permanente de la mémoire en un écosystème de jeu mondial. Nous opérons à l'intersection des neurosciences, de la psychologie cognitive et de la technologie du jeu.",
    vision: "Chaque nouvelle langue que vous apprenez vous ouvre une nouvelle porte dans l'écosystème technologique et commercial mondial. Avec l'infrastructure scientifique de memolandum.com, vous pouvez terminer une langue et passer à la suivante, étirer vos limites cognitives et élever votre développement personnel au-dessus des standards mondiaux.",
    whyTitle: "Pourquoi memolandum.com?",
    whyItems: [
      { bold: "Puissance Subliminale:", text: "Acquisition permanente de la langue grâce aux mécanismes d'apprentissage implicite en jouant, sans s'en rendre compte." },
      { bold: "Bibliothèque Arcade en Expansion:", text: "Modules de jeux rétro en croissance constante au-delà de 6 jeux." },
      { bold: "Pool Mondial de Langues:", text: "L'opportunité de dominer la vie intellectuelle et professionnelle avec toutes les langues du monde." },
      { bold: "Acquisition Permanente de Vocabulaire:", text: "Jusqu'à 50% d'apprentissage plus permanent comparé aux méthodes traditionnelles." },
      { bold: "Concentration Maximale:", text: "Algorithmes scientifiques qui capturent cette haute concentration des salles d'arcade des années 90." },
    ],
    scienceLabel: "Fondements Scientifiques",
    theoryLabel: "📖 Théorie",
    solutionLabel: "🎮 Notre Solution",
    visionLabel: "Vision Mondiale",
    whyLabel: "Pourquoi memolandum.com?",
  },
  {
    code: "es", flag: "🇪🇸", name: "Español",
    intro: "memolandum.com es una plataforma de nueva generación que deja atrás los métodos de aprendizaje tradicionales y aburridos, transformando la gestión permanente de la memoria en un ecosistema de juego global. Operamos en la intersección de la neurociencia, la psicología cognitiva y la tecnología del juego.",
    vision: "Cada nuevo idioma que aprendes te abre una nueva puerta en el ecosistema tecnológico y empresarial global. Con la infraestructura científica de memolandum.com, puedes terminar un idioma y pasar al siguiente, estirar tus límites cognitivos y elevar tu desarrollo personal por encima de los estándares globales.",
    whyTitle: "¿Por qué memolandum.com?",
    whyItems: [
      { bold: "Poder Subliminal:", text: "Adquisición permanente del idioma a través de mecanismos de aprendizaje implícito mientras juegas, sin darte cuenta." },
      { bold: "Biblioteca Arcade en Expansión:", text: "Módulos de juegos retro que crecen constantemente más allá de 6 juegos." },
      { bold: "Pool Global de Idiomas:", text: "La oportunidad de dominar la vida intelectual y profesional con todos los idiomas del mundo." },
      { bold: "Adquisición Permanente de Vocabulario:", text: "Hasta un 50% de aprendizaje más permanente comparado con los métodos tradicionales." },
      { bold: "Máxima Concentración:", text: "Algoritmos científicos que capturan esa alta concentración de los salones de arcade de los 90." },
    ],
    scienceLabel: "Fundamentos Científicos",
    theoryLabel: "📖 Teoría",
    solutionLabel: "🎮 Nuestra Solución",
    visionLabel: "Visión Global",
    whyLabel: "¿Por qué memolandum.com?",
  },
  {
    code: "ja", flag: "🇯🇵", name: "日本語",
    intro: "memolandum.comは、退屈な従来の学習方法を打破し、永続的な記憶管理をグローバルなゲームエコシステムに変革する次世代プラットフォームです。神経科学、認知心理学、ゲームテクノロジーの交差点で運営しています。",
    vision: "学ぶ新しい言語ごとに、グローバルなテクノロジーとビジネスエコシステムへの新しい扉が開きます。memolandum.comの科学的インフラを使えば、一つの言語を終えて次へと進み、認知的限界を広げ、個人的成長をグローバル基準を超えたレベルへと引き上げることができます。",
    whyTitle: "なぜmemolandum.comなのか？",
    whyItems: [
      { bold: "潜在的な力:", text: "気づかないうちにゲームをしながら、暗示的学習メカニズムによる永続的な言語習得。" },
      { bold: "拡大するアーケードライブラリ:", text: "6ゲームを超えて常に成長するレトロゲームモジュール。" },
      { bold: "グローバル言語プール:", text: "時間をかけて追加される世界すべての言語で知的・職業的生活を支配する機会。" },
      { bold: "永続的な語彙習得:", text: "1日わずか10分のプレイで、従来の方法と比べて最大50%より永続的な学習。" },
      { bold: "最大集中:", text: "退屈なフラッシュカードの代わりに、90年代アーケードホールの高い集中力を科学的アルゴリズムで実現。" },
    ],
    scienceLabel: "科学的基盤",
    theoryLabel: "📖 理論",
    solutionLabel: "🎮 私たちのソリューション",
    visionLabel: "グローバルビジョン",
    whyLabel: "なぜmemolandum.comなのか？",
  },
  {
    code: "zh", flag: "🇨🇳", name: "中文",
    intro: "memolandum.com是下一代平台，抛开传统枯燥的学习方式，将永久记忆管理转变为全球游戏生态系统。我们在神经科学、认知心理学和游戏技术的交汇处运营。",
    vision: "您学习的每种新语言都为您打开全球技术和商业生态系统的新大门。借助memolandum.com的科学基础设施，您可以完成一种语言后进入下一种，拓展认知边界，将个人发展提升到全球标准之上。",
    whyTitle: "为什么选择memolandum.com？",
    whyItems: [
      { bold: "潜意识力量:", text: "在玩游戏时不知不觉地通过隐式学习机制实现永久语言习得。" },
      { bold: "不断扩展的街机库:", text: "超越6款游戏持续增长的复古游戏模块。" },
      { bold: "全球语言池:", text: "随着时间推移添加的所有世界语言主导智力和职业生活的机会。" },
      { bold: "永久词汇习得:", text: "每天仅玩10分钟，与传统方法相比可实现高达50%的更持久学习。" },
      { bold: "最大专注:", text: "用科学算法捕捉90年代街机厅的高专注状态，而非枯燥的闪卡。" },
    ],
    scienceLabel: "科学基础",
    theoryLabel: "📖 理论",
    solutionLabel: "🎮 我们的解决方案",
    visionLabel: "全球愿景",
    whyLabel: "为什么选择memolandum.com？",
  },
  {
    code: "ar", flag: "🇸🇦", name: "العربية",
    intro: "memolandum.com منصة من الجيل القادم تتجاوز أساليب التعلم التقليدية الممللة، وتحوّل إدارة الذاكرة الدائمة إلى نظام بيئي للألعاب العالمية. نعمل عند تقاطع علم الأعصاب وعلم النفس المعرفي وتكنولوجيا الألعاب.",
    vision: "كل لغة جديدة تتعلمها تفتح أمامك بابًا جديدًا في النظام البيئي التقني والتجاري العالمي. بفضل البنية التحتية العلمية لـ memolandum.com، يمكنك إتقان لغة والانتقال إلى التالية، وتوسيع حدودك المعرفية، ورفع تطورك الشخصي فوق المعايير العالمية.",
    whyTitle: "لماذا memolandum.com؟",
    whyItems: [
      { bold: "القوة تحت الواعية:", text: "اكتساب دائم للغة عبر آليات التعلم الضمني أثناء اللعب دون أن تدرك ذلك." },
      { bold: "مكتبة ألعاب متنامية:", text: "وحدات ألعاب ريترو تتجاوز 6 ألعاب وتنمو باستمرار." },
      { bold: "مجمع لغات عالمي:", text: "فرصة السيطرة على الحياة الفكرية والمهنية بجميع لغات العالم." },
      { bold: "اكتساب مفردات دائم:", text: "تعلم أكثر ديمومة بنسبة تصل إلى 50% مقارنة بالطرق التقليدية باللعب 10 دقائق يوميًا فقط." },
      { bold: "تركيز أقصى:", text: "خوارزميات علمية تستعيد التركيز العالي لصالات الألعاب في التسعينيات بدلًا من البطاقات الممللة." },
    ],
    scienceLabel: "الأسس العلمية",
    theoryLabel: "📖 النظرية",
    solutionLabel: "🎮 حلّنا",
    visionLabel: "رؤية عالمية",
    whyLabel: "لماذا memolandum.com؟",
  },
];

export default function AboutClient() {
  const t = useT();
  const [activeLang, setActiveLang] = useState("tr");
  const [expandedCard, setExpandedCard] = useState(null);

  const lang = ALL_LANGS.find((l) => l.code === activeLang) || ALL_LANGS[0];
  const isRTL = activeLang === "ar";

  return (
    <div style={{ minHeight: "100vh", background: "#060b14", color: "#e2e8f0" }}>
      <Header />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,211,238,0.10) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(168,85,247,0.07) 0%, transparent 60%)",
        }} />
        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "56px 16px 0" }}>
          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#22d3ee", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", marginBottom: 36 }}
          >
            ← {t("common.back")}
          </Link>

          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{
              display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#22d3ee",
              border: "1px solid rgba(34,211,238,0.3)", borderRadius: 999, padding: "4px 14px", marginBottom: 16,
              background: "rgba(34,211,238,0.05)", fontFamily: "monospace",
            }}>
              🧬 SCIENCE · MISSION · VISION
            </span>
            <h1 style={{
              fontSize: "clamp(2.2rem, 7vw, 4rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1,
              background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 50%, #f472b6 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 12px",
            }}>
              MEMOLANDUM
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Dünya genelinde öğrencilere bilimsel temelli, oyun destekli dil öğrenme deneyimi sunuyoruz.<br />
              <span style={{ fontSize: 12 }}>Building the world&apos;s most engaging vocabulary acquisition ecosystem.</span>
            </p>
          </div>

          {/* Language Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 48 }}>
            {ALL_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setActiveLang(l.code); setExpandedCard(null); }}
                style={{
                  padding: "7px 16px", borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  border: activeLang === l.code ? "1px solid rgba(34,211,238,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  background: activeLang === l.code ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
                  color: activeLang === l.code ? "#22d3ee" : "#94a3b8",
                  transition: "all 0.2s", whiteSpace: "nowrap",
                }}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Per-Language Content ──────────────────────────────── */}
      <div
        key={activeLang}
        dir={isRTL ? "rtl" : "ltr"}
        style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 80px", animation: "fadeUp 0.35s ease" }}
      >
        {/* Intro */}
        <div style={{
          borderRadius: 16, border: "1px solid rgba(34,211,238,0.12)",
          background: "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.5) 100%)",
          padding: "20px 24px", marginBottom: 36, backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>{lang.flag}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#f1f5f9" }}>{lang.name}</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#475569", letterSpacing: "0.1em" }}>ABOUT MEMOLANDUM</div>
            </div>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.75, margin: 0 }}>{lang.intro}</p>
        </div>

        {/* Science Cards */}
        <div style={{
          fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#475569",
          letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16,
        }}>
          ⚗️ {lang.scienceLabel}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {SCIENCE_POINTS.map((pt) => {
            const cardKey = `${activeLang}-${pt.id}`;
            const isOpen = expandedCard === cardKey;
            return (
              <div
                key={pt.id}
                onClick={() => setExpandedCard(isOpen ? null : cardKey)}
                style={{
                  borderRadius: 14, cursor: "pointer", overflow: "hidden",
                  border: `1px solid ${isOpen ? pt.accent + "33" : "rgba(255,255,255,0.06)"}`,
                  background: isOpen
                    ? `linear-gradient(135deg, ${pt.accent}0a 0%, rgba(15,23,42,0.95) 100%)`
                    : "rgba(15,23,42,0.7)",
                  boxShadow: isOpen ? `0 0 24px ${pt.accent}12` : "none",
                  transition: "all 0.25s",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{pt.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: pt.accent, letterSpacing: "0.01em" }}>
                      {pt.labels[activeLang]}
                    </span>
                  </div>
                  <span style={{ color: pt.accent, fontSize: 20, transition: "transform 0.25s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>›</span>
                </div>

                {/* Expandable body */}
                {isOpen && (
                  <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Theory */}
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${pt.accent}18` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: pt.accent, letterSpacing: "0.1em", marginBottom: 6, fontFamily: "monospace" }}>
                        {lang.theoryLabel}
                      </div>
                      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                        {pt.theory[activeLang]}
                      </p>
                    </div>
                    {/* Solution */}
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(168,85,247,0.12)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 6, fontFamily: "monospace" }}>
                        {lang.solutionLabel}
                      </div>
                      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                        {pt.solution[activeLang]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Why memolandum */}
        <div style={{
          borderRadius: 16, border: "1px solid rgba(250,204,21,0.2)",
          background: "linear-gradient(135deg, rgba(250,204,21,0.05) 0%, rgba(15,23,42,0.9) 100%)",
          padding: "20px 24px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#facc15", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 14 }}>
            ✓ {lang.whyTitle}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {lang.whyItems.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#22d3ee", marginTop: 2, flexShrink: 0 }}>✓</span>
                <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                  <strong style={{ color: "#f1f5f9" }}>{item.bold}</strong> {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vision */}
        <div style={{
          borderRadius: 16, border: "1px solid rgba(168,85,247,0.2)",
          background: "linear-gradient(135deg, rgba(168,85,247,0.07) 0%, rgba(34,211,238,0.04) 100%)",
          padding: "20px 24px", marginBottom: 32,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>
            🌌 {lang.visionLabel}
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.75, margin: 0 }}>{lang.vision}</p>
          <p style={{ color: "#475569", fontSize: 12, fontStyle: "italic", textAlign: "center", marginTop: 14, marginBottom: 0 }}>
            &ldquo;{activeLang === "tr"
              ? "Geleceğin öğrenme teknolojisini, bilişimin sıfır noktası olan retro ruhuyla inşa ediyoruz."
              : "We build the learning technology of the future with the retro spirit, the ground zero of computing."}&rdquo;
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 40 }}>
          {[
            { n: "8+", label: activeLang === "tr" ? "Desteklenen Dil" : "Languages" },
            { n: "6", label: activeLang === "tr" ? "Arcade Oyun" : "Arcade Games" },
            { n: "AI", label: "Gemini Powered" },
            { n: "+%50", label: activeLang === "tr" ? "Öğrenme Artışı" : "Learning Boost" },
          ].map((s) => (
            <div key={s.label} style={{
              textAlign: "center", borderRadius: 12, padding: "20px 8px",
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{
                fontSize: 22, fontWeight: 900,
                background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{
          borderRadius: 14, border: "1px solid rgba(16,185,129,0.2)",
          background: "rgba(16,185,129,0.04)", padding: "18px 22px", textAlign: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 8 }}>
            {activeLang === "tr" ? "İletişim & İş Birliği" : "Contact & Collaboration"}
          </div>
          <p style={{ color: "#64748b", fontSize: 12, marginBottom: 10 }}>
            {activeLang === "tr"
              ? "Bilişsel algoritmalarımız veya kurumsal iş birlikleri için her zaman ulaşabilirsiniz."
              : "For our cognitive algorithms or corporate collaborations, feel free to reach out anytime."}
          </p>
          <a href="mailto:info@memolandum.com" style={{ color: "#22d3ee", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            info@memolandum.com
          </a>
          <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>
            {activeLang === "tr" ? "Merkez: Ankara, Türkiye" : "HQ: Ankara, Turkey"}
          </div>
        </div>
      </div>

      {/* Bottom lang strip */}
      <div style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>
            Available in / Şu dillerde mevcut
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {ALL_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setActiveLang(l.code); setExpandedCard(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  color: "#475569", transition: "all 0.2s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                onMouseOut={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }` }} />
    </div>
  );
}
