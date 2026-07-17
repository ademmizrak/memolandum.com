"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useT } from "../../lib/i18n/LocaleProvider";

/* ─────────────────────────────────────────────────────────────────────────────
   12 Dil + Bilimsel İçerik
   Desteklenen çiftler: TR-EN, DE, FR, ES, IT, JA, ZH, AR, RU, KO, PT, EL, OSM
───────────────────────────────────────────────────────────────────────────── */

const SCIENCE_POINTS = [
  {
    id: "subliminal", accent: "#22d3ee", icon: "🧠",
    labels: {
      tr: "01. Subliminal & Örtük Öğrenme",
      en: "01. Subliminal & Implicit Learning",
      de: "01. Subliminal- & Implizites Lernen",
      fr: "01. Apprentissage Subliminal & Implicite",
      es: "01. Aprendizaje Subliminal & Implícito",
      it: "01. Apprendimento Subliminale & Implicito",
      ja: "01. 潜在的・暗示的学習",
      zh: "01. 潜意识与隐式学习",
      ar: "01. التعلم تحت الواعي والضمني",
      ru: "01. Сублиминальное и неявное обучение",
      ko: "01. 잠재의식 & 암묵적 학습",
      pt: "01. Aprendizagem Subliminar & Implícita",
      el: "01. Υποσυνείδητη & Σιωπηρή Μάθηση",
      osm: "01. Bilinçdışı & Örtük Öğrenme",
    },
    theory: {
      tr: "Araştırmacı Arthur Reber'in 1967'de keşfettiği örtük öğrenme teorisi; insan beyninin farkında olmadığı uyaranlar aracılığıyla karmaşık örüntüleri sessizce içselleştirebildiğini kanıtlar.",
      en: "Researcher Arthur Reber's 1967 discovery proves the brain silently internalizes complex patterns through stimuli it isn't consciously aware of — the foundation of game-based vocabulary encoding.",
      de: "Arthur Rebers 1967 entdeckte Theorie des impliziten Lernens beweist, dass das Gehirn Muster durch unbewusste Reize verinnerlichen kann.",
      fr: "La théorie de l'apprentissage implicite d'Arthur Reber (1967) prouve que le cerveau peut intérioriser des schémas complexes à travers des stimuli non conscients.",
      es: "La teoría del aprendizaje implícito de Arthur Reber (1967) demuestra que el cerebro internaliza patrones complejos a través de estímulos inconscientes.",
      it: "La teoria dell'apprendimento implicito di Arthur Reber (1967) dimostra che il cervello può interiorizzare silenziosamente schemi complessi attraverso stimoli inconsci.",
      ja: "アーサー・レーバーの1967年の発見は、脳が意識的に気づかない刺激を通じて複雑なパターンを静かに内在化できることを証明しています。",
      zh: "阿瑟·雷伯1967年的发现证明，大脑可以通过无意识刺激静默地内化复杂模式。",
      ar: "تُثبت نظرية آرثر ريبر (1967) أن الدماغ يستوعب أنماطًا معقدة عبر مثيرات غير واعية.",
      ru: "Исследование Артура Ребера (1967) доказывает, что мозг бессознательно усваивает сложные паттерны через неосознаваемые стимулы.",
      ko: "아서 레버의 1967년 연구는 뇌가 의식하지 못하는 자극을 통해 복잡한 패턴을 조용히 내면화할 수 있음을 증명합니다.",
      pt: "A descoberta de Arthur Reber em 1967 prova que o cérebro internaliza silenciosamente padrões complexos através de estímulos inconscientes.",
      el: "Η ανακάλυψη του Arthur Reber (1967) αποδεικνύει ότι ο εγκέφαλος εσωτερικεύει αθόρυβα σύνθετα μοτίβα μέσα από ασυνείδητα ερεθίσματα.",
      osm: "Reber'in 1967'deki keşfi; zihnin, şuurun dışındaki uyarılarla karmaşık örüntüleri sessizce içine sindirebildiğini ispat eder.",
    },
    solution: {
      tr: "Oyun motorlarında, siz ana hedefe odaklanmışken periferik vizyon alanınızda hedef dildeki kelime kalıpları beyninize servis edilir.",
      en: "While you focus on the game target, word patterns in the target language are delivered to your brain in the peripheral visual field — encoding without effort.",
      de: "Während Sie sich auf das Spielziel konzentrieren, werden Zielsprachen-Wortmuster in Ihrem peripheren Sichtfeld verarbeitet.",
      fr: "Pendant que vous vous concentrez sur l'objectif du jeu, des modèles de mots sont transmis à votre cerveau dans votre vision périphérique.",
      es: "Mientras te concentras en el objetivo del juego, los patrones de palabras se entregan a tu cerebro en tu campo visual periférico.",
      it: "Mentre ti concentri sull'obiettivo di gioco, i modelli di parole vengono consegnati al tuo cervello nel campo visivo periferico.",
      ja: "ゲームのターゲットに集中している間、周辺視野でターゲット言語の単語パターンが脳に提供されます。",
      zh: "当您专注于游戏目标时，目标语言的单词模式会在您的周边视野中传递给您的大脑。",
      ar: "بينما تركّز على هدف اللعبة، تُغذَّى الأنماط اللغوية إلى دماغك عبر مجال الرؤية المحيطية.",
      ru: "Пока вы сосредоточены на игровой цели, словесные паттерны целевого языка поступают в мозг через периферийное зрение.",
      ko: "게임 목표에 집중하는 동안, 목표 언어의 단어 패턴이 주변 시야를 통해 뇌에 전달됩니다.",
      pt: "Enquanto você se concentra no objetivo do jogo, padrões de palavras no idioma alvo são entregues ao seu cérebro no campo visual periférico.",
      el: "Ενώ εστιάζετε στον στόχο του παιχνιδιού, μοτίβα λέξεων στοχεύονται στον εγκέφαλό σας μέσω της περιφερικής όρασης.",
      osm: "Oyunun hedefine odaklanmışken, hedef dilin kelime kalıpları muhit-i beser sahasında zihninize nakşedilir.",
    },
  },
  {
    id: "ebbinghaus", accent: "#facc15", icon: "📈",
    labels: {
      tr: "02. Ebbinghaus Unutma Eğrisi & Aralıklı Tekrar",
      en: "02. Ebbinghaus Forgetting Curve & Spaced Repetition",
      de: "02. Ebbinghaus'sche Vergessenskurve & Verteiltes Lernen",
      fr: "02. Courbe de l'Oubli d'Ebbinghaus & Répétition Espacée",
      es: "02. Curva del Olvido de Ebbinghaus & Repetición Espaciada",
      it: "02. Curva dell'Oblio di Ebbinghaus & Ripetizione Spaziata",
      ja: "02. エビングハウスの忘却曲線と間隔反復",
      zh: "02. 艾宾浩斯遗忘曲线与间隔重复",
      ar: "02. منحنى النسيان لإيبنغهاوس والتكرار المتباعد",
      ru: "02. Кривая забывания Эббингауза & Интервальные повторения",
      ko: "02. 에빙하우스 망각 곡선 & 간격 반복",
      pt: "02. Curva do Esquecimento de Ebbinghaus & Repetição Espaçada",
      el: "02. Καμπύλη망각ής Ebbinghaus & Διαστηματική Επανάληψη",
      osm: "02. Ebbinghaus Nisyan Eğrisi & Fasılalı Tekrar",
    },
    theory: {
      tr: "1885'te Hermann Ebbinghaus tarafından keşfedilen Unutma Eğrisi, yeni öğrenilen bilgilerin tekrar edilmediği takdirde saatler içinde %60'ından fazlasının kaybolduğunu gösterir. Wozniak & Leitner'ın aralıklı tekrar yöntemi bu eğriye karşı en güçlü bilimsel silahtır.",
      en: "Hermann Ebbinghaus (1885) showed over 60% of new information is lost within hours if not repeated. Wozniak & Leitner's spaced repetition method is the most powerful scientific countermeasure.",
      de: "Hermann Ebbinghaus (1885) zeigte, dass über 60% neuer Informationen ohne Wiederholung verloren gehen. Die Methode des verteilten Lernens ist das wirksamste Gegenmittel.",
      fr: "Hermann Ebbinghaus (1885) a démontré que plus de 60% des nouvelles informations sont perdues en quelques heures sans répétition.",
      es: "Hermann Ebbinghaus (1885) mostró que más del 60% de la información nueva se pierde en horas sin repetición.",
      it: "Hermann Ebbinghaus (1885) dimostrò che oltre il 60% delle nuove informazioni viene perso in poche ore senza ripetizione.",
      ja: "ヘルマン・エビングハウス（1885年）は、繰り返しなしで新しい情報の60%以上が数時間以内に失われることを示しました。",
      zh: "赫尔曼·艾宾浩斯（1885年）表明，新信息如果不重复，超过60%会在几小时内丢失。",
      ar: "أثبت هيرمان إيبنغهاوس (1885) أن أكثر من 60% من المعلومات الجديدة تُفقد في ساعات دون تكرار.",
      ru: "Герман Эббингауз (1885) показал, что более 60% новой информации теряется в течение часов без повторения.",
      ko: "헤르만 에빙하우스(1885)는 반복 없이 새로운 정보의 60% 이상이 몇 시간 내에 사라진다는 것을 보여주었습니다.",
      pt: "Hermann Ebbinghaus (1885) demonstrou que mais de 60% das novas informações são perdidas em horas sem repetição.",
      el: "Ο Hermann Ebbinghaus (1885) έδειξε ότι πάνω από το 60% των νέων πληροφοριών χάνεται μέσα σε ώρες χωρίς επανάληψη.",
      osm: "Ebbinghaus (1885), yeni öğrenilen malumatın tekrarsız birkaç saat zarfında yüzde altmışından fazlasının zihinden silindiğini ispat eyledi.",
    },
    solution: {
      tr: "memolandum.com algoritmaları, bir kelimeyi unutmak üzere olduğunuz kritik anda tekrar karşınıza çıkararak bilginin kalıcı hafızaya geçişini sağlar.",
      en: "memolandum.com algorithms calculate the critical breaking point and present words right before you forget them — transferring vocabulary to long-term memory.",
      de: "Die Algorithmen von memolandum.com berechnen den kritischen Kipppunkt und präsentieren Wörter kurz vor dem Vergessen.",
      fr: "Les algorithmes de memolandum.com calculent le point critique et vous présentent les mots juste avant que vous les oubliiez.",
      es: "Los algoritmos de memolandum.com calculan el punto crítico y te presentan las palabras justo antes de que las olvides.",
      it: "Gli algoritmi di memolandum.com calcolano il punto critico e presentano le parole giusto prima che le dimentichi.",
      ja: "memolandum.comのアルゴリズムは、忘れる直前のタイミングで単語を提示し、長期記憶への転送を保証します。",
      zh: "memolandum.com的算法在您即将忘记时恰好呈现单词，确保其转移到长期记忆。",
      ar: "تحسب خوارزميات memolandum.com النقطة الحرجة وتعرض الكلمات قبيل نسيانها مباشرة.",
      ru: "Алгоритмы memolandum.com рассчитывают критический момент и показывают слова прямо перед забыванием.",
      ko: "memolandum.com의 알고리즘은 잊기 직전의 임계점을 계산하고 단어를 정확한 타이밍에 제시합니다.",
      pt: "Os algoritmos do memolandum.com calculam o ponto crítico e apresentam as palavras exatamente antes de você esquecê-las.",
      el: "Οι αλγόριθμοι του memolandum.com υπολογίζουν το κρίσιμο σημείο και παρουσιάζουν λέξεις ακριβώς πριν τις ξεχάσετε.",
      osm: "Memolandum'un hesap makineleri, bir kelimeyi neredeyse nisyana terk etmek üzere olduğunuz o nazik anda onu yeniden huzurunuza çıkarır.",
    },
  },
  {
    id: "paivio", accent: "#4ade80", icon: "🎨",
    labels: {
      tr: "03. İkili Kodlama Teorisi — Allan Paivio (1971)",
      en: "03. Dual-Coding Theory — Allan Paivio (1971)",
      de: "03. Duale Kodierungstheorie — Allan Paivio (1971)",
      fr: "03. Théorie du Double Codage — Allan Paivio (1971)",
      es: "03. Teoría de la Codificación Dual — Allan Paivio (1971)",
      it: "03. Teoria della Codifica Duale — Allan Paivio (1971)",
      ja: "03. デュアルコーディング理論 — アラン・パイヴィオ（1971年）",
      zh: "03. 双重编码理论 — 阿兰·佩维奥（1971年）",
      ar: "03. نظرية الترميز المزدوج — ألان بايفيو (1971)",
      ru: "03. Теория двойного кодирования — Аллан Пайвио (1971)",
      ko: "03. 이중 코딩 이론 — 앨런 파이비오 (1971)",
      pt: "03. Teoria da Codificação Dupla — Allan Paivio (1971)",
      el: "03. Θεωρία Διπλής Κωδικοποίησης — Allan Paivio (1971)",
      osm: "03. Çifte Tahrir Nazariyesi — Allan Paivio (1971)",
    },
    theory: {
      tr: "Allan Paivio'nun İkili Kodlama Teorisi (1971), insan beyninin bilgiyi hem görsel hem de sözel kanallardan ayrı ayrı işlediğini ortaya koyar. İki kanaldan aynı anda bilgi girdiğinde akılda kalıcılık katlanarak artar.",
      en: "Allan Paivio's Dual-Coding Theory (1971) reveals the brain processes information separately via visual and verbal channels. When both channels are activated simultaneously, retention increases exponentially.",
      de: "Paivios Theorie (1971) zeigt, dass das Gehirn Informationen über visuelle und verbale Kanäle separat verarbeitet. Bei gleichzeitiger Aktivierung steigt die Behaltensleistung exponentiell.",
      fr: "La théorie de Paivio (1971) révèle que le cerveau traite les informations séparément via des canaux visuels et verbaux. La rétention augmente exponentiellement lorsque les deux canaux sont activés.",
      es: "La teoría de Paivio (1971) revela que el cerebro procesa información por separado a través de canales visuales y verbales. La retención aumenta exponencialmente cuando ambos canales se activan simultáneamente.",
      it: "La teoria di Paivio (1971) rivela che il cervello elabora le informazioni separatamente attraverso canali visivi e verbali, con ritenzione esponenzialmente maggiore se entrambi i canali sono attivati.",
      ja: "パイヴィオの理論（1971年）は、脳が視覚チャンネルと言語チャンネルを別々に処理することを示し、両方が同時に活性化されると保持率が指数関数的に増加します。",
      zh: "佩维奥的理论（1971年）揭示大脑通过视觉和语言通道分别处理信息，两者同时激活时保留率指数级增长。",
      ar: "تكشف نظرية بايفيو (1971) أن الدماغ يعالج المعلومات عبر قناتين بصرية ولفظية، ويرتفع الاحتفاظ بشكل أسي حين تُنشَّط القناتان معاً.",
      ru: "Теория Пайвио (1971) показывает, что мозг обрабатывает информацию отдельно через визуальные и вербальные каналы — запоминание экспоненциально растёт при активации обоих.",
      ko: "파이비오의 이론(1971)은 뇌가 시각 및 언어 채널을 통해 별도로 정보를 처리하며, 두 채널이 동시에 활성화되면 보유율이 기하급수적으로 증가함을 보여줍니다.",
      pt: "A teoria de Paivio (1971) revela que o cérebro processa informações separadamente através de canais visuais e verbais, com retenção aumentando exponencialmente quando ambos são ativados.",
      el: "Η θεωρία Paivio (1971) αποκαλύπτει ότι ο εγκέφαλος επεξεργάζεται πληροφορίες ξεχωριστά μέσω οπτικών και λεκτικών καναλιών.",
      osm: "Paivio'nun 1971 nazariyesi; zihnin malumatı göz ve kelam kanallarından ayrıca işlediğini, her ikisi birden devreye girince hıfz kuvvetinin misliyle arttığını beyan eder.",
    },
    solution: {
      tr: "Platformumuzun HTML5 Canvas tabanlı oyun motorları, metinsel veriyi dinamik görsel uyaranlarla birleştirir. Sadece okumaz, aynı zamanda görür ve mekansal hafızanızı tetiklersiniz.",
      en: "Our HTML5 Canvas-based game engines pair text with dynamic visual stimuli. You don't just read — you see, react, and trigger spatial memory simultaneously.",
      de: "Unsere Spielmotoren kombinieren Text mit visuellen Reizen. Sie lesen nicht nur — Sie sehen, reagieren und aktivieren räumliches Gedächtnis.",
      fr: "Nos moteurs combinent texte et stimuli visuels. Vous ne lisez pas seulement — vous voyez, réagissez et activez la mémoire spatiale.",
      es: "Nuestros motores combinan texto con estímulos visuales. No solo lees — ves, reaccionas y activas la memoria espacial.",
      it: "I nostri motori combinano testo con stimoli visivi. Non leggi solo — vedi, reagisci e attivi la memoria spaziale.",
      ja: "ゲームエンジンはテキストと動的視覚刺激を組み合わせます。読むだけでなく、見て反応し空間記憶を起動させます。",
      zh: "游戏引擎将文本与动态视觉刺激相结合。您不只是阅读——您看到、反应并激活空间记忆。",
      ar: "تجمع محركاتنا بين النص والمحفّزات البصرية الديناميكية. لا تقرأ فحسب، بل ترى وتتفاعل وتُنشّط الذاكرة المكانية.",
      ru: "Наши игровые движки сочетают текст с динамическими визуальными стимулами. Вы не просто читаете — вы видите, реагируете и активируете пространственную память.",
      ko: "게임 엔진은 텍스트와 동적 시각 자극을 결합합니다. 읽기만 하는 것이 아니라 보고, 반응하고, 공간 기억을 활성화합니다.",
      pt: "Nossos motores combinam texto com estímulos visuais dinâmicos. Você não apenas lê — vê, reage e ativa a memória espacial.",
      el: "Οι κινητήρες παιχνιδιών μας συνδυάζουν κείμενο με δυναμικά οπτικά ερεθίσματα. Δεν διαβάζετε μόνο — βλέπετε και ενεργοποιείτε τη χωρική μνήμη.",
      osm: "Oyun motorlarımız metni görsel uyarıcılarla buluşturur. Yalnızca okumakla kalmaz; görür, irkilir ve mekânî hafızanızı işletirsiniz.",
    },
  },
  {
    id: "csikszentmihalyi", accent: "#a78bfa", icon: "🌊",
    labels: {
      tr: "04. Akış Teorisi & Oyunlaştırma — Csikszentmihalyi",
      en: "04. Flow Theory & Gamification — Csikszentmihalyi",
      de: "04. Flow-Theorie & Gamification — Csikszentmihalyi",
      fr: "04. Théorie du Flow & Gamification — Csikszentmihalyi",
      es: "04. Teoría del Flow & Gamificación — Csikszentmihalyi",
      it: "04. Teoria del Flow & Gamificazione — Csikszentmihalyi",
      ja: "04. フロー理論 & ゲーミフィケーション — チクセントミハイ",
      zh: "04. 心流理论 & 游戏化 — 契克森米哈伊",
      ar: "04. نظرية التدفق والتلعيب — تشيكسينتميهالي",
      ru: "04. Теория потока & Геймификация — Чиксентмихайи",
      ko: "04. 몰입 이론 & 게이미피케이션 — 칙센트미하이",
      pt: "04. Teoria do Fluxo & Gamificação — Csikszentmihalyi",
      el: "04. Θεωρία Ροής & Εκπαιδευτική Παιχνιδοποίηση — Csikszentmihalyi",
      osm: "04. Akış Nazariyesi & Oyunlaştırma — Csikszentmihalyi",
    },
    theory: {
      tr: "Mihaly Csikszentmihalyi'nin Flow Teorisi, beceri düzeyi ile zorluk dengelendiğinde 'pürüzsüz odaklanma' evresine girildiğini ve dopamin salınımının arttığını kanıtlar.",
      en: "Csikszentmihalyi's Flow Theory proves that when skill and challenge are balanced, the learner enters a 'smooth focus' state with increased dopamine — making learning effortless.",
      de: "Die Flow-Theorie beweist, dass beim Gleichgewicht von Fähigkeit und Schwierigkeit ein 'reibungsloser Fokus' mit erhöhtem Dopamin eintritt.",
      fr: "La théorie du Flow prouve que lorsque compétence et défi sont équilibrés, l'apprenant entre dans un état de 'concentration fluide' avec augmentation de la dopamine.",
      es: "La Teoría del Flow prueba que cuando habilidad y desafío están equilibrados, el aprendiz entra en un estado de 'enfoque fluido' con mayor dopamina.",
      it: "La Teoria del Flow dimostra che quando abilità e sfida sono bilanciate, si entra in uno stato di 'concentrazione fluida' con aumento della dopamina.",
      ja: "フロー理論は、スキルと課題のバランスが取れているとき、学習者がドーパミンの増加とともに「スムーズな集中」状態に入ることを証明します。",
      zh: "心流理论证明，当技能与挑战平衡时，学习者进入多巴胺增加的'顺畅专注'状态。",
      ar: "تُثبت نظرية التدفق أنه حين يتوازن المهارة مع الصعوبة، يدخل المتعلم في حالة 'تركيز سلس' مع ارتفاع الدوبامين.",
      ru: "Теория потока доказывает, что при балансе навыков и сложности учащийся входит в состояние «плавного фокуса» с повышением дофамина.",
      ko: "몰입 이론은 기술과 도전이 균형을 이룰 때 학습자가 도파민 증가와 함께 '부드러운 집중' 상태에 들어감을 증명합니다.",
      pt: "A Teoria do Fluxo prova que quando habilidade e desafio estão equilibrados, o aprendiz entra em um estado de 'foco fluido' com dopamina aumentada.",
      el: "Η Θεωρία Ροής αποδεικνύει ότι όταν δεξιότητα και πρόκληση ισορροπούν, ο μαθητής εισέρχεται σε κατάσταση 'ρέουσας εστίασης' με αύξηση της ντοπαμίνης.",
      osm: "Csikszentmihalyi'nin Akış Nazariyesi, maharet ve güçlük dengelenince 'pürüzsüz bir teksif' haline girildiğini ve dopaminin arttığını ispat eder.",
    },
    solution: {
      tr: "Oyun modüllerimiz kullanıcının anlık kelime hakimiyetine göre dinamik olarak zorlaşır veya kolaylaşır. Öğrenme bir 'yük' değil, sürdürülebilir bir 'pozitif bağımlılık' haline gelir.",
      en: "Our game modules dynamically adjust difficulty to your live vocabulary mastery. Learning becomes not a burden but a sustainable positive engagement.",
      de: "Unsere Spielmodule passen die Schwierigkeit dynamisch an. Lernen wird zur nachhaltigen positiven Beschäftigung statt zur Last.",
      fr: "Nos modules s'adaptent dynamiquement à votre maîtrise. L'apprentissage devient un engagement positif durable, pas une charge.",
      es: "Nuestros módulos se adaptan dinámicamente a tu dominio. El aprendizaje se convierte en un compromiso positivo sostenible, no en una carga.",
      it: "I nostri moduli si adattano dinamicamente. L'apprendimento diventa un impegno positivo sostenibile, non un peso.",
      ja: "モジュールは習熟度に応じて動的に調整されます。学習が負担ではなく持続可能なポジティブな関与になります。",
      zh: "我们的模块根据掌握程度动态调整。学习成为可持续的积极参与，而非负担。",
      ar: "تتكيّف وحداتنا ديناميكيًا مع مستوى إتقانك. يصبح التعلم انخراطًا إيجابيًا مستدامًا لا عبئًا.",
      ru: "Наши модули динамически адаптируются к уровню владения. Обучение становится устойчивым позитивным вовлечением.",
      ko: "모듈은 숙달 수준에 따라 동적으로 조정됩니다. 학습이 부담이 아닌 지속 가능한 긍정적 참여가 됩니다.",
      pt: "Nossos módulos se adaptam dinamicamente ao seu domínio. O aprendizado torna-se um engajamento positivo sustentável, não um fardo.",
      el: "Οι ενότητες μας προσαρμόζονται δυναμικά στη γνωστική σας ικανότητα. Η μάθηση γίνεται βιώσιμη θετική εμπλοκή.",
      osm: "Oyun birimlerimiz kullanıcının anlık kelime hâkimiyetine nazaran zorlaşıp kolaylaşır. Tahsil bir yük olmaktan çıkıp müspet bir alışkanlığa dönüşür.",
    },
  },
  {
    id: "recall", accent: "#f472b6", icon: "⚡",
    labels: {
      tr: "05. Aktif Hatırlama — Roediger & Karpicke (Science, 2006)",
      en: "05. Active Recall — Roediger & Karpicke (Science, 2006)",
      de: "05. Aktives Erinnern — Roediger & Karpicke (Science, 2006)",
      fr: "05. Rappel Actif — Roediger & Karpicke (Science, 2006)",
      es: "05. Recuerdo Activo — Roediger & Karpicke (Science, 2006)",
      it: "05. Richiamo Attivo — Roediger & Karpicke (Science, 2006)",
      ja: "05. アクティブリコール — ロディガー & カーピッケ（Science, 2006）",
      zh: "05. 主动回忆 — 罗迪格 & 卡尔皮克（Science, 2006）",
      ar: "05. الاستذكار النشط — رودجر وكاربيكي (Science, 2006)",
      ru: "05. Активное воспроизведение — Роедигер & Карпике (Science, 2006)",
      ko: "05. 능동적 회상 — 로디거 & 카피키 (Science, 2006)",
      pt: "05. Recuperação Ativa — Roediger & Karpicke (Science, 2006)",
      el: "05. Ενεργή Ανάκληση — Roediger & Karpicke (Science, 2006)",
      osm: "05. Etkin Hatırlama — Roediger & Karpicke (Science, 2006)",
    },
    theory: {
      tr: "2006'da Science dergisinde yayımlanan bu araştırma, bilgiyi aktif olarak geri çağırmanın pasif okumaya göre %50 daha kalıcı öğrenme sağladığını bilimsel olarak kanıtladı.",
      en: "This landmark 2006 Science paper proved scientifically that actively recalling information produces up to 50% stronger memory retention versus passive re-reading.",
      de: "Diese wegweisende Studie in Science (2006) bewies, dass aktives Abrufen bis zu 50% stärkere Gedächtnisleistung erzeugt als passives Lesen.",
      fr: "Cette étude phare de Science (2006) a prouvé que le rappel actif produit jusqu'à 50% de rétention mémorielle plus forte que la relecture passive.",
      es: "Este estudio en Science (2006) demostró que el recuerdo activo produce hasta un 50% más de retención que la relectura pasiva.",
      it: "Questo studio su Science (2006) ha dimostrato che il richiamo attivo produce fino al 50% in più di ritenzione della memoria rispetto alla rilettura passiva.",
      ja: "Science誌のこの2006年論文は、能動的な想起が受動的な再読と比較して最大50%強い記憶保持をもたらすことを科学的に証明しました。",
      zh: "这篇2006年的Science论文科学地证明，主动回忆与被动重读相比，可产生高达50%更强的记忆保留。",
      ar: "أثبت هذا البحث الرائد في Science (2006) علميًا أن استدعاء المعلومات بنشاط ينتج احتفاظًا بالذاكرة أقوى بنسبة تصل إلى 50% مقارنة بإعادة القراءة السلبية.",
      ru: "Это знаковое исследование в Science (2006) научно доказало, что активное воспроизведение информации обеспечивает до 50% более устойчивое запоминание по сравнению с пассивным перечитыванием.",
      ko: "Science지(2006)의 이 획기적인 연구는 능동적 회상이 수동적 재독과 비교해 최대 50% 더 강한 기억 보유를 생성함을 과학적으로 증명했습니다.",
      pt: "Este estudo pioneiro na Science (2006) provou cientificamente que a recuperação ativa produz até 50% mais retenção de memória do que a releitura passiva.",
      el: "Αυτή η ορόσημο μελέτη στο Science (2006) απέδειξε επιστημονικά ότι η ενεργή ανάκληση παράγει έως 50% ισχυρότερη μνήμη σε σχέση με την παθητική επανανάγνωση.",
      osm: "Science dergisindeki bu mühim araştırma (2006), bilginin etkin hatırlanmasının pasif okumaya kıyasla yüzde elliye varan nispette daha kalıcı hıfzı sağladığını ispat eyledi.",
    },
    solution: {
      tr: "memolandum.com sizi kelimeleri ezberletmez; arcade mekanikleriyle bilgiyi içeriden aktif olarak çağırmaya zorlar. Skor üretme ve zamana karşı yarışma nöral yolları hızlandırır.",
      en: "memolandum.com doesn't make you memorize — arcade mechanics force active recall. The drive to score and race time accelerates neural pathways.",
      de: "memolandum.com lässt Sie nicht auswendig lernen — Arcade-Mechaniken erzwingen aktives Abrufen. Punktesammeln und Zeitrennen beschleunigen neuronale Pfade.",
      fr: "memolandum.com ne vous fait pas mémoriser — les mécaniques d'arcade forcent le rappel actif. La course aux points accélère les voies neuronales.",
      es: "memolandum.com no te hace memorizar — la mecánica arcade fuerza el recuerdo activo. La carrera por puntos acelera las vías neuronales.",
      it: "memolandum.com non ti fa memorizzare — le meccaniche arcade forzano il richiamo attivo. La corsa ai punti accelera i percorsi neurali.",
      ja: "memolandum.comは暗記させるのではなく、アーケードメカニクスが能動的な想起を強制します。スコアと時間の競争が神経経路を加速させます。",
      zh: "memolandum.com不会让您死记硬背——街机游戏机制强制主动回忆。得分和时间竞争加速神经通路。",
      ar: "لا يجعلك memolandum.com تحفظ — ميكانيكيات الألعاب تُرغمك على الاستذكار النشط. المسابقة على النقاط والوقت تُسرّع المسارات العصبية.",
      ru: "memolandum.com не заставляет зубрить — игровые механики вынуждают активно воспроизводить. Гонка за очками ускоряет нейронные пути.",
      ko: "memolandum.com은 암기를 강요하지 않습니다 — 아케이드 메카닉이 능동적 회상을 강제합니다. 점수와 시간 경쟁이 신경 경로를 가속화합니다.",
      pt: "memolandum.com não faz você memorizar — mecânicas arcade forçam a recuperação ativa. A corrida por pontos acelera os caminhos neurais.",
      el: "Το memolandum.com δεν σε κάνει να απομνημονεύεις — οι μηχανισμοί arcade αναγκάζουν την ενεργή ανάκληση. Η κούρσα για πόντους επιταχύνει τα νευρικά μονοπάτια.",
      osm: "Memolandum oyun mekanizmaları yalnızca hıfzettirmez; bilginin içeriden etkin hatırlanmasını zorunlu kılar. Skor yarışı ve zaman baskısı sinir yollarını hızlandırır.",
    },
  },
];

/* ── 12 dil + Osmanlıca tanımları ─────────────────────────────────────────── */
const ALL_LANGS = [
  {
    code: "tr", flag: "🇹🇷", name: "Türkçe",
    speakers: "85M",
    intro: "memolandum.com, geleneksel ve sıkıcı öğrenme metotlarını geride bırakarak kalıcı hafıza yönetimini küresel bir oyun ekosistemine dönüştüren yeni nesil bir platformdur.",
    vision: "Her yeni dil dünya bilişim ve iş ekosisteminde size yeni bir kapı açar. memolandum.com'un bilimsel altyapısıyla bir dili bitirip diğerine geçebilir, tıpkı sıfır noktasından başlayan atari piksellerinin bugün dünyayı yönetmesi gibi kendinizi inşa edebilirsiniz.",
    why: [
      { b: "Örtük öğrenme gücü:", t: "Oyun oynarken, farkında olmadan kalıcı dil edinimi." },
      { b: "Genişleyen Arcade Kütüphanesi:", t: "6 oyunla sınırlı kalmayan, büyüyen retro modüller." },
      { b: "Kalıcı kelime edinimi:", t: "Günde 10 dakika, geleneksel yöntemlere göre %50 daha kalıcı." },
      { b: "YDS / YKS hazırlık:", t: "Sınav odaklı kelime setleri, seviye bazlı listeler." },
    ],
  },
  {
    code: "en", flag: "🇬🇧", name: "English",
    speakers: "1.5B",
    intro: "memolandum.com is a next-generation platform transforming memory management into a global game ecosystem — leaving boring traditional methods behind.",
    vision: "Every language you learn opens a new door in the global tech and business world. With memolandum.com's scientific infrastructure, master world languages from zero — just as the arcade pixels of yesterday now rule the world.",
    why: [
      { b: "Implicit learning power:", t: "Permanent language acquisition through gameplay, without realizing it." },
      { b: "Ever-expanding Arcade Library:", t: "Retro game modules growing beyond 6 games." },
      { b: "Permanent vocabulary:", t: "10 minutes a day — up to 50% more lasting than traditional methods." },
      { b: "Exam preparation:", t: "Level-based and exam-focused word sets." },
    ],
  },
  {
    code: "ru", flag: "🇷🇺", name: "Русский",
    speakers: "260M",
    intro: "memolandum.com — платформа нового поколения, превращающая управление памятью в глобальную игровую экосистему на основе нейронауки и когнитивной психологии.",
    vision: "Каждый новый язык открывает новые возможности в мировой экономике. С научной инфраструктурой memolandum.com вы можете освоить мировые языки с нуля — как аркадные пиксели прошлого стали управлять миром сегодня.",
    why: [
      { b: "Неявное обучение:", t: "Постоянное усвоение языка во время игры, без осознанных усилий." },
      { b: "Растущая Arcade-библиотека:", t: "Ретро-игровые модули, не ограниченные 6 играми." },
      { b: "Устойчивый словарный запас:", t: "10 минут в день — до 50% более устойчивое запоминание." },
      { b: "Подготовка к экзаменам:", t: "Наборы слов по уровням и для подготовки к экзаменам." },
    ],
  },
  {
    code: "pt", flag: "🇧🇷", name: "Português",
    speakers: "260M",
    intro: "memolandum.com é uma plataforma de nova geração que transforma o gerenciamento da memória em um ecossistema de jogos global, deixando para trás os métodos tradicionais e entediantes.",
    vision: "Cada novo idioma abre uma nova porta no ecossistema global de tecnologia e negócios. Com a infraestrutura científica do memolandum.com, você pode dominar os idiomas do mundo a partir do zero.",
    why: [
      { b: "Poder do aprendizado implícito:", t: "Aquisição permanente de idiomas durante o jogo, sem perceber." },
      { b: "Biblioteca Arcade em expansão:", t: "Módulos de jogos retrô crescendo além de 6 jogos." },
      { b: "Vocabulário permanente:", t: "10 minutos por dia — até 50% mais duradouro que métodos tradicionais." },
      { b: "Preparação para exames:", t: "Conjuntos de palavras por nível e focados em exames." },
    ],
  },
  {
    code: "ko", flag: "🇰🇷", name: "한국어",
    speakers: "80M",
    intro: "memolandum.com은 기억 관리를 글로벌 게임 생태계로 변환하는 차세대 플랫폼으로, 신경과학, 인지심리학, 게임 기술의 교차점에서 운영됩니다.",
    vision: "배우는 모든 새로운 언어는 글로벌 기술 및 비즈니스 생태계에서 새로운 문을 열어줍니다. memolandum.com의 과학적 인프라로 세계 언어를 제로에서 마스터할 수 있습니다.",
    why: [
      { b: "암묵적 학습의 힘:", t: "게임을 하는 동안 인식하지 못하면서 영구적인 언어 습득." },
      { b: "확장되는 아케이드 라이브러리:", t: "6개 게임을 넘어 계속 성장하는 레트로 게임 모듈." },
      { b: "영구적인 어휘:", t: "하루 10분 — 전통적인 방법보다 최대 50% 더 지속적." },
      { b: "시험 준비:", t: "레벨 기반 및 시험 중심 단어 세트." },
    ],
  },
  {
    code: "de", flag: "🇩🇪", name: "Deutsch",
    speakers: "130M",
    intro: "memolandum.com ist eine Plattform der nächsten Generation, die Gedächtnismanagement in ein globales Spiel-Ökosystem verwandelt — an der Schnittstelle von Neurowissenschaft und Spieltechnologie.",
    vision: "Jede neue Sprache öffnet eine neue Tür im globalen Technologie- und Geschäftsökosystem. Mit der wissenschaftlichen Infrastruktur von memolandum.com können Sie Weltsprachen von null an beherrschen.",
    why: [
      { b: "Implizites Lernen:", t: "Dauerhafter Spracherwerb beim Spielen, ohne es zu merken." },
      { b: "Wachsende Arcade-Bibliothek:", t: "Retro-Spielmodule, die über 6 Spiele hinauswachsen." },
      { b: "Dauerhafter Wortschatz:", t: "10 Minuten täglich — bis zu 50% dauerhafter als traditionelle Methoden." },
      { b: "Prüfungsvorbereitung:", t: "Level-basierte und prüfungsorientierte Wortlisten." },
    ],
  },
  {
    code: "fr", flag: "🇫🇷", name: "Français",
    speakers: "280M",
    intro: "memolandum.com est une plateforme de nouvelle génération transformant la gestion de la mémoire en un écosystème de jeu mondial, à l'intersection des neurosciences et de la psychologie cognitive.",
    vision: "Chaque nouvelle langue ouvre une nouvelle porte dans l'écosystème mondial. Avec l'infrastructure scientifique de memolandum.com, maîtrisez les langues du monde depuis zéro.",
    why: [
      { b: "Apprentissage implicite:", t: "Acquisition permanente de la langue en jouant, sans s'en rendre compte." },
      { b: "Bibliothèque Arcade en expansion:", t: "Modules rétro croissant au-delà de 6 jeux." },
      { b: "Vocabulaire permanent:", t: "10 minutes par jour — jusqu'à 50% plus durable que les méthodes traditionnelles." },
      { b: "Préparation aux examens:", t: "Listes de mots par niveau et orientées examens." },
    ],
  },
  {
    code: "es", flag: "🇪🇸", name: "Español",
    speakers: "500M",
    intro: "memolandum.com es una plataforma de nueva generación que transforma la gestión de la memoria en un ecosistema de juego global, en la intersección de la neurociencia y la psicología cognitiva.",
    vision: "Cada nuevo idioma abre una nueva puerta en el ecosistema global. Con la infraestructura científica de memolandum.com, domina los idiomas del mundo desde cero.",
    why: [
      { b: "Aprendizaje implícito:", t: "Adquisición permanente del idioma mientras juegas, sin darte cuenta." },
      { b: "Biblioteca Arcade en expansión:", t: "Módulos retro que crecen más allá de 6 juegos." },
      { b: "Vocabulario permanente:", t: "10 minutos al día — hasta un 50% más duradero." },
      { b: "Preparación para exámenes:", t: "Listas de palabras por nivel y orientadas a exámenes." },
    ],
  },
  {
    code: "it", flag: "🇮🇹", name: "Italiano",
    speakers: "85M",
    intro: "memolandum.com è una piattaforma di nuova generazione che trasforma la gestione della memoria in un ecosistema di gioco globale, all'incrocio tra neuroscienze e psicologia cognitiva.",
    vision: "Ogni nuova lingua apre una nuova porta nell'ecosistema globale. Con l'infrastruttura scientifica di memolandum.com, padroneggia le lingue del mondo da zero.",
    why: [
      { b: "Apprendimento implicito:", t: "Acquisizione permanente della lingua durante il gioco, senza accorgersene." },
      { b: "Biblioteca Arcade in espansione:", t: "Moduli retro che crescono oltre 6 giochi." },
      { b: "Vocabolario permanente:", t: "10 minuti al giorno — fino al 50% più duraturo." },
      { b: "Preparazione agli esami:", t: "Liste di parole per livello e orientate agli esami." },
    ],
  },
  {
    code: "ja", flag: "🇯🇵", name: "日本語",
    speakers: "125M",
    intro: "memolandum.comは、神経科学、認知心理学、ゲームテクノロジーの交差点で、記憶管理をグローバルなゲームエコシステムに変革する次世代プラットフォームです。",
    vision: "学ぶすべての新しい言語が、グローバルな技術・ビジネス生態系への新しい扉を開きます。memolandum.comの科学的インフラで、世界言語をゼロから習得できます。",
    why: [
      { b: "暗示的学習の力:", t: "気づかないうちにゲームで永続的な言語習得。" },
      { b: "拡大するアーケードライブラリ:", t: "6ゲームを超えて成長するレトロゲームモジュール。" },
      { b: "永続的な語彙:", t: "1日10分 — 従来の方法より最大50%持続的。" },
      { b: "試験準備:", t: "レベル別および試験向けの単語セット。" },
    ],
  },
  {
    code: "zh", flag: "🇨🇳", name: "中文",
    speakers: "1.1B",
    intro: "memolandum.com是下一代平台，在神经科学、认知心理学和游戏技术的交汇处，将记忆管理转变为全球游戏生态系统。",
    vision: "您学习的每种新语言都为全球生态系统打开新大门。借助memolandum.com的科学基础设施，从零开始掌握世界语言。",
    why: [
      { b: "隐式学习的力量:", t: "在游戏中不知不觉地永久习得语言。" },
      { b: "不断扩展的街机库:", t: "超越6款游戏持续增长的复古模块。" },
      { b: "永久词汇:", t: "每天10分钟 — 比传统方法持久50%。" },
      { b: "考试准备:", t: "按级别和考试导向的单词集。" },
    ],
  },
  {
    code: "ar", flag: "🇸🇦", name: "العربية",
    speakers: "420M",
    intro: "memolandum.com منصة الجيل القادم التي تحوّل إدارة الذاكرة إلى نظام بيئي للألعاب العالمية عند تقاطع علم الأعصاب وعلم النفس المعرفي.",
    vision: "كل لغة جديدة تتعلمها تفتح بابًا جديدًا في النظام البيئي العالمي. بفضل البنية التحتية العلمية لـ memolandum.com، أتقن لغات العالم من الصفر.",
    why: [
      { b: "قوة التعلم الضمني:", t: "اكتساب دائم للغة أثناء اللعب دون إدراك." },
      { b: "مكتبة ألعاب متنامية:", t: "وحدات ألعاب ريترو تتجاوز 6 ألعاب." },
      { b: "مفردات دائمة:", t: "10 دقائق يوميًا — أكثر ديمومة بنسبة 50%." },
      { b: "التحضير للامتحانات:", t: "قوائم كلمات حسب المستوى والامتحانات." },
    ],
  },
  {
    code: "el", flag: "🇬🇷", name: "Ελληνικά",
    speakers: "13M",
    intro: "Το memolandum.com είναι μια πλατφόρμα νέας γενιάς που μετατρέπει τη διαχείριση μνήμης σε ένα παγκόσμιο οικοσύστημα παιχνιδιών, στη διασταύρωση νευροεπιστήμης και γνωστικής ψυχολογίας.",
    vision: "Κάθε νέα γλώσσα που μαθαίνεις ανοίγει μια νέα πόρτα. Με την επιστημονική υποδομή του memolandum.com, κατακτήστε τις γλώσσες του κόσμου από το μηδέν.",
    why: [
      { b: "Σιωπηρή μάθηση:", t: "Μόνιμη γλωσσική απόκτηση κατά τη διάρκεια του παιχνιδιού, χωρίς συνείδηση." },
      { b: "Βιβλιοθήκη Arcade σε επέκταση:", t: "Ρετρό ενότητες παιχνιδιών που αναπτύσσονται πέρα από 6 παιχνίδια." },
      { b: "Μόνιμο λεξιλόγιο:", t: "10 λεπτά την ημέρα — έως 50% πιο ανθεκτικό." },
      { b: "Προετοιμασία εξετάσεων:", t: "Λίστες λέξεων ανά επίπεδο και εξετασιακές." },
    ],
  },
  {
    code: "osm", flag: "☽", name: "Osmanlıca",
    speakers: "Heritage",
    intro: "memolandum.com, asrın usulden uzak ve mülâl verici tahsil yollarını geride bırakarak hafıza-yı dâimi idâresini küresel bir oyun ekosistemine tahvil eden yeni nesil bir bârgâh-ı irfandır.",
    vision: "Her yeni dil, dünya ticaret ve ilim muhitinde size yeni bir kapı açar. Memolandum'un bilimsel altyapısıyla bir dili ikmal edip diğerine geçebilir, sıfırdan başlayarak dünya lisanlarına hâkim olabilirsiniz.",
    why: [
      { b: "Örtük öğrenme kudreti:", t: "Oyun zevkiyle, farkında olmaksızın, kalıcı dil tahsili." },
      { b: "Büyüyen Arcade kütüphanesi:", t: "Altı oyunla sınırlı kalmayan, devamlı gelişen retro birimler." },
      { b: "Kalıcı kelime edinimi:", t: "Günde on dakika oynayarak geleneksel yöntemlere göre yüzde elli daha derin hıfz." },
      { b: "Sınav hazırlığı:", t: "Seviye bazlı ve sınav odaklı kelime listeleri." },
    ],
  },
];

const SCIENCE_ACCENT_DEF = ["#22d3ee", "#facc15", "#4ade80", "#a78bfa", "#f472b6"];

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
        <div style={{ position: "relative", maxWidth: 940, margin: "0 auto", padding: "56px 16px 0" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#22d3ee", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", marginBottom: 36 }}>
            ← {t("common.back")}
          </Link>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 999, padding: "4px 14px", marginBottom: 14, background: "rgba(34,211,238,0.05)", fontFamily: "monospace" }}>
              🧬 SCIENCE · MISSION · VISION
            </span>
            <h1 style={{ fontSize: "clamp(2.2rem,7vw,4rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, background: "linear-gradient(135deg,#22d3ee 0%,#a78bfa 50%,#f472b6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 12px" }}>
              MEMOLANDUM
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Dünya genelinde öğrencilere bilimsel temelli, oyun destekli dil öğrenme deneyimi sunuyoruz.<br />
              <span style={{ fontSize: 12 }}>Building the world&apos;s most engaging vocabulary acquisition ecosystem.</span>
            </p>
          </div>

          {/* ── 14 Dil Seçici ──────────────────────────────────── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, textAlign: "center", fontFamily: "monospace" }}>
            {activeLang === "tr" ? "Açıklama Dilini Seçin" : activeLang === "ar" ? "اختر لغة الشرح" : activeLang === "ru" ? "Выберите язык описания" : activeLang === "ko" ? "설명 언어 선택" : activeLang === "zh" ? "选择说明语言" : activeLang === "el" ? "Επιλέξτε γλώσσα επεξήγησης" : activeLang === "osm" ? "Lisân-ı Beyânı İntihâb Ediniz" : "Select Explanation Language"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 7, marginBottom: 44 }}>
            {ALL_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setActiveLang(l.code); setExpandedCard(null); }}
                title={`${l.name} — ${l.speakers} konuşucu`}
                style={{
                  padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                  border: activeLang === l.code ? "1px solid rgba(34,211,238,0.6)" : "1px solid rgba(255,255,255,0.07)",
                  background: activeLang === l.code ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
                  color: activeLang === l.code ? "#22d3ee" : "#94a3b8",
                  transition: "all 0.18s", whiteSpace: "nowrap",
                }}
              >
                {l.flag} {l.name}
                <span style={{ fontSize: 10, color: activeLang === l.code ? "rgba(34,211,238,0.6)" : "#475569", marginLeft: 4 }}>{l.speakers}</span>
              </button>
            ))}
          </div>

          {/* Global speaker count */}
          <p style={{ textAlign: "center", fontSize: 12, color: "#334155", fontFamily: "monospace", marginBottom: 40, letterSpacing: "0.08em" }}>
            🌍 Bu içerik toplamda <span style={{ color: "#22d3ee", fontWeight: 700 }}>4+ milyar</span> konuşucuya ulaşıyor
          </p>
        </div>
      </div>

      {/* ── Per-Language Content ──────────────────────────────── */}
      <div
        key={activeLang}
        dir={isRTL ? "rtl" : "ltr"}
        style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 80px", animation: "fadeUp 0.35s ease" }}
      >
        {/* Intro card */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(34,211,238,0.12)", background: "linear-gradient(135deg,rgba(15,23,42,0.9) 0%,rgba(30,41,59,0.5) 100%)", padding: "20px 24px", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{lang.flag}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#f1f5f9" }}>{lang.name}</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#475569", letterSpacing: "0.1em" }}>ABOUT MEMOLANDUM · {lang.speakers} SPEAKERS</div>
            </div>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.75, margin: 0 }}>{lang.intro}</p>
        </div>

        {/* Science Cards */}
        <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>
          ⚗️ {activeLang === "tr" ? "Bilimsel Temeller" : activeLang === "ar" ? "الأسس العلمية" : activeLang === "ru" ? "Научные основы" : activeLang === "ko" ? "과학적 기반" : activeLang === "zh" ? "科学基础" : activeLang === "el" ? "Επιστημονικές Βάσεις" : activeLang === "osm" ? "İlmî Esaslar" : "Scientific Foundations"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 36 }}>
          {SCIENCE_POINTS.map((pt) => {
            const cardKey = `${activeLang}-${pt.id}`;
            const isOpen = expandedCard === cardKey;
            return (
              <div key={pt.id} onClick={() => setExpandedCard(isOpen ? null : cardKey)}
                style={{ borderRadius: 13, cursor: "pointer", overflow: "hidden", border: `1px solid ${isOpen ? pt.accent + "33" : "rgba(255,255,255,0.06)"}`, background: isOpen ? `linear-gradient(135deg,${pt.accent}0a 0%,rgba(15,23,42,.95) 100%)` : "rgba(15,23,42,0.7)", boxShadow: isOpen ? `0 0 24px ${pt.accent}12` : "none", transition: "all 0.22s" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 17 }}>{pt.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 12.5, color: pt.accent, letterSpacing: "0.01em" }}>
                      {pt.labels[activeLang] || pt.labels["en"]}
                    </span>
                  </div>
                  <span style={{ color: pt.accent, fontSize: 20, transition: "transform 0.22s", transform: isOpen ? "rotate(90deg)" : "none", flexShrink: 0 }}>›</span>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "11px 14px", border: `1px solid ${pt.accent}18` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: pt.accent, letterSpacing: "0.1em", marginBottom: 5, fontFamily: "monospace" }}>📖 THEORY</div>
                      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{pt.theory[activeLang] || pt.theory["en"]}</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "11px 14px", border: "1px solid rgba(168,85,247,0.12)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 5, fontFamily: "monospace" }}>🎮 SOLUTION</div>
                      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{pt.solution[activeLang] || pt.solution["en"]}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Why */}
        {lang.why && (
          <div style={{ borderRadius: 16, border: "1px solid rgba(250,204,21,0.18)", background: "linear-gradient(135deg,rgba(250,204,21,0.05) 0%,rgba(15,23,42,.9) 100%)", padding: "18px 22px", marginBottom: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#facc15", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>✓ {lang.code === "tr" ? "Neden Memolandum?" : "Why Memolandum?"}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
              {lang.why.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ color: "#22d3ee", marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}><strong style={{ color: "#f1f5f9" }}>{item.b}</strong> {item.t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vision */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(168,85,247,0.2)", background: "linear-gradient(135deg,rgba(168,85,247,.07) 0%,rgba(34,211,238,.04) 100%)", padding: "18px 22px", marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 8 }}>
            🌌 {activeLang === "tr" ? "Küresel Vizyon" : activeLang === "ar" ? "رؤية عالمية" : activeLang === "ru" ? "Глобальное видение" : activeLang === "ko" ? "글로벌 비전" : activeLang === "el" ? "Παγκόσμιο Όραμα" : activeLang === "osm" ? "Küresel Vizyon" : "Global Vision"}
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.75, margin: 0 }}>{lang.vision}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 36 }}>
          {[
            { n: "14", label: activeLang === "tr" ? "Dil" : "Languages" },
            { n: "6+", label: activeLang === "tr" ? "Arcade Oyun" : "Arcade Games" },
            { n: "AI", label: "Gemini Powered" },
            { n: "4B+", label: activeLang === "tr" ? "Konuşucu" : "Speakers" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", borderRadius: 12, padding: "18px 8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg,#22d3ee,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.n}</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ borderRadius: 14, border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.03)", padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 7 }}>
            {activeLang === "tr" ? "İletişim & İş Birliği" : "Contact & Collaboration"}
          </div>
          <a href="mailto:info@memolandum.com" style={{ color: "#22d3ee", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>info@memolandum.com</a>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>HQ: Ankara, Türkiye</div>
        </div>
      </div>

      {/* ── Bottom language strip ─────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
            14 Languages / 14 Dil / 14 Langues / 14 Idiomas
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 7 }}>
            {ALL_LANGS.map((l) => (
              <button key={l.code}
                onClick={() => { setActiveLang(l.code); setExpandedCard(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#475569", transition: "all 0.18s" }}
                onMouseOver={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                onMouseOut={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}" }} />
    </div>
  );
}
