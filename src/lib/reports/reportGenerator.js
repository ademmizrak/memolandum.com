/**
 * Memolandum Veli Raporlama, Başarı Karnesi & Aile İletişim Motoru
 * Öğrencinin kelime dağarcığını, müfredat uyumluluğunu, 7 günlük çalışma ritmini,
 * öğrendiği/zorlandığı kelimeleri ve aile içi iletişim araçlarını üretir.
 */

import { getWeakWords, countDueWords, countTodayStudiedWords } from "../learning/weakWordsService.js";

/**
 * Soft child isolation: untagged legacy rows stay visible (backward compatible).
 * When childId is set, keep rows for that child + rows without childId.
 */
export function belongsToChild(item, childId) {
  if (!childId) return true;
  if (!item || item.childId == null || item.childId === "") return true;
  return String(item.childId) === String(childId);
}

export function filterVaultByChild(vocabularyVault = {}, childId = null) {
  if (!childId) return vocabularyVault || {};
  const out = {};
  for (const [key, item] of Object.entries(vocabularyVault || {})) {
    if (belongsToChild(item, childId)) out[key] = item;
  }
  return out;
}

export function filterQuizByChild(quizHistory = [], childId = null) {
  if (!childId) return quizHistory || [];
  return (quizHistory || []).filter((h) => belongsToChild(h, childId));
}

/**
 * Sınıf düzeyine göre örnek kelimeler ve Türkçe okunuş ipuçları
 * (Henüz gerçek veri yoksa veya az kelime varsa "Evde 3 Kelime Sor" etkinliği için)
 */
const GRADE_SAMPLE_WORDS = {
  "1": [
    { english: "apple", turkish: "elma", phonetic: "ep-ıl" },
    { english: "cat", turkish: "kedi", phonetic: "ket" },
    { english: "book", turkish: "kitap", phonetic: "buk" },
    { english: "blue", turkish: "mavi", phonetic: "blu" },
    { english: "mother", turkish: "anne", phonetic: "madır" },
    { english: "school", turkish: "okul", phonetic: "skul" },
  ],
  "2": [
    { english: "lemon", turkish: "limon", phonetic: "lem-ın" },
    { english: "friend", turkish: "arkadaş", phonetic: "frend" },
    { english: "morning", turkish: "sabah", phonetic: "mor-ning" },
    { english: "monkey", turkish: "maymun", phonetic: "man-ki" },
    { english: "pencil", turkish: "kurşun kalem", phonetic: "pen-sıl" },
    { english: "happy", turkish: "mutlu", phonetic: "hep-i" },
  ],
  "3": [
    { english: "family", turkish: "aile", phonetic: "fem-i-li" },
    { english: "strong", turkish: "güçlü", phonetic: "strong" },
    { english: "hospital", turkish: "hastane", phonetic: "hos-pi-tıl" },
    { english: "weather", turkish: "hava durumu", phonetic: "ve-dır" },
    { english: "library", turkish: "kütüphane", phonetic: "lay-bre-ri" },
    { english: "sunny", turkish: "güneşli", phonetic: "san-i" },
  ],
  "4": [
    { english: "country", turkish: "ülke", phonetic: "kan-tri" },
    { english: "science", turkish: "fen bilimleri", phonetic: "say-ıns" },
    { english: "clothes", turkish: "kıyafetler", phonetic: "klovz" },
    { english: "experiment", turkish: "deney", phonetic: "eks-pe-ri-mınt" },
    { english: "umbrella", turkish: "şemsiye", phonetic: "am-brel-la" },
    { english: "scientist", turkish: "bilim insanı", phonetic: "say-ın-tist" },
  ],
  "5": [
    { english: "timetable", turkish: "ders programı", phonetic: "taym-tey-bıl" },
    { english: "pharmacy", turkish: "eczane", phonetic: "far-ma-si" },
    { english: "headache", turkish: "baş ağrısı", phonetic: "hed-eyk" },
    { english: "delicious", turkish: "lezzetli", phonetic: "di-li-şıs" },
    { english: "invitation", turkish: "davetiye", phonetic: "in-vi-tey-şın" },
    { english: "bakery", turkish: "fırın", phonetic: "bey-kı-ri" },
  ],
  "6": [
    { english: "neighborhood", turkish: "mahalle", phonetic: "ney-bır-hud" },
    { english: "nutritious", turkish: "besleyici", phonetic: "nü-tri-şıs" },
    { english: "downtown", turkish: "şehir merkezi", phonetic: "daun-taun" },
    { english: "anxious", turkish: "endişeli", phonetic: "enk-şıs" },
    { english: "occupation", turkish: "meslek", phonetic: "ok-yu-pey-şın" },
    { english: "environment", turkish: "çevre", phonetic: "en-vay-rın-mınt" },
  ],
  "7": [
    { english: "generous", turkish: "cömert", phonetic: "ce-nı-rıs" },
    { english: "stubborn", turkish: "inatçı", phonetic: "sta-börn" },
    { english: "equipment", turkish: "ekipman / araç", phonetic: "i-kuip-mınt" },
    { english: "achievement", turkish: "başarı", phonetic: "a-çiv-mınt" },
    { english: "extinction", turkish: "nesli tükenme", phonetic: "eks-tink-şın" },
    { english: "planet", turkish: "gezegen", phonetic: "ple-nıt" },
  ],
  "8": [
    { english: "friendship", turkish: "arkadaşlık / dostluk", phonetic: "frend-şip" },
    { english: "honest", turkish: "dürüst", phonetic: "a-nıst" },
    { english: "ingredient", turkish: "içindekiler / malzeme", phonetic: "in-gri-di-ınt" },
    { english: "communication", turkish: "iletişim", phonetic: "kı-mü-ni-key-şın" },
    { english: "invention", turkish: "icat / buluş", phonetic: "in-ven-şın" },
    { english: "responsibility", turkish: "sorumluluk", phonetic: "ri-spon-si-bi-li-ti" },
  ],
  "yds": [
    { english: "Crucial", turkish: "Hayati / Çok önemli", phonetic: "kru-şıl" },
    { english: "Inevitable", turkish: "Kaçınılmaz", phonetic: "in-ev-i-tı-bıl" },
    { english: "Sustainable", turkish: "Sürdürülebilir", phonetic: "sıs-tey-nı-bıl" },
    { english: "Comprehensive", turkish: "Kapsamlı", phonetic: "kom-pri-hen-siv" },
    { english: "Abundant", turkish: "Bol / Bereketli", phonetic: "ı-ban-dınt" },
    { english: "Mitigate", turkish: "Hafifletmek / Azaltmak", phonetic: "mi-ti-geyt" },
  ],
};

function resolveCurriculumInfo(selectedChild, lastPlayedLevel, activeStudyProfile) {
  const rawGrade = String(selectedChild?.grade || lastPlayedLevel || "").toLowerCase();
  const rawLabel = String(selectedChild?.gradeLabel || "").replace(/^[^\wÇĞİÖŞÜçğıöşü0-9]+\s*/, "").trim();

  if (rawGrade.includes("1-sinif") || rawGrade.includes("ilkokul-0") || rawGrade.includes("ilkokul-1")) {
    return { name: rawLabel || "1. Sınıf İngilizce", gradeKey: "1" };
  }
  if (rawGrade.includes("2-sinif") || rawGrade.includes("ilkokul-2")) {
    return { name: rawLabel || "2. Sınıf İngilizce", gradeKey: "2" };
  }
  if (rawGrade.includes("3-sinif") || rawGrade.includes("ilkokul-3")) {
    return { name: rawLabel || "3. Sınıf İngilizce", gradeKey: "3" };
  }
  if (rawGrade.includes("4-sinif") || rawGrade.includes("ilkokul-4")) {
    return { name: rawLabel || "4. Sınıf İngilizce", gradeKey: "4" };
  }
  if (rawGrade.includes("5-sinif") || rawGrade.includes("ortaokul-5")) {
    return { name: rawLabel || "5. Sınıf Ortaokul İngilizce", gradeKey: "5" };
  }
  if (rawGrade.includes("6-sinif") || rawGrade.includes("ortaokul-6")) {
    return { name: rawLabel || "6. Sınıf Ortaokul İngilizce", gradeKey: "6" };
  }
  if (rawGrade.includes("7-sinif") || rawGrade.includes("ortaokul-7")) {
    return { name: rawLabel || "7. Sınıf Ortaokul İngilizce", gradeKey: "7" };
  }
  if (rawGrade.includes("8-sinif") || rawGrade.includes("ortaokul-8") || rawGrade.includes("lgs")) {
    return { name: rawLabel || "8. Sınıf & LGS İngilizce", gradeKey: "8" };
  }
  if (rawGrade.includes("yds") || rawGrade.includes("yokdil") || rawGrade.includes("genel-sinav")) {
    return { name: rawLabel || "YDS & YÖKDİL Sınav Hazırlık", gradeKey: "yds" };
  }
  if (rawLabel) {
    return { name: rawLabel, gradeKey: "2" };
  }
  if (activeStudyProfile?.label) {
    return { name: `${activeStudyProfile.label} Müfredatı`, gradeKey: "3" };
  }
  return { name: "İlkokul & Ortaokul İngilizce", gradeKey: "2" };
}

export function calculateParentReportData({
  vocabularyVault = {},
  quizHistory = [],
  globalStats = {},
  profile = null,
  activeStudyProfile = null,
  lastPlayedLevel = null,
  selectedChild = null,
  childId = null,
  joinedClassroom = null,
}) {
  const resolvedChildId = childId || selectedChild?.id || null;
  const scopedVault = filterVaultByChild(vocabularyVault, resolvedChildId);
  const scopedHistory = filterQuizByChild(quizHistory, resolvedChildId);
  const words = Object.values(scopedVault || {});
  const totalWords = words.length;

  // Kalıcılık ve ezber güçleri + gerçek kelime örnekleri
  let permanentWords = 0; // %100 veya 3+ tekrar
  let learningWords = 0;  // %50-%75
  let newWords = 0;       // %25 veya yeni
  let mebWordsCount = 0;

  const masteredCandidates = [];

  words.forEach((w) => {
    if (!w || typeof w !== "object") return;
    const langStr = String(w.language || "").toLowerCase();
    const idStr = String(w.id || "").toLowerCase();
    if (
      langStr.includes("ilkokul") ||
      langStr.includes("ortaokul") ||
      langStr.includes("meb") ||
      idStr.includes("ilkokul") ||
      idStr.includes("ortaokul") ||
      idStr.includes("meb")
    ) {
      mebWordsCount++;
    }

    const repetitions = Number(w.repetitions) || 0;
    const strength = Number(w.strength) || 1;
    const progress = Number(w.learningProgressPct) || 0;
    const eng = String(w.english || w.word || "").trim();
    const tr = String(w.turkish || w.meaning || "").trim();

    if (w.firstTryCorrect || progress >= 100 || repetitions >= 3 || strength >= 4) {
      permanentWords++;
      if (eng) {
        masteredCandidates.push({
          id: w.id || eng.toLowerCase(),
          english: eng,
          turkish: tr,
          audioUrl: w.audioUrl || "",
          strength: Math.max(strength, 4),
          lastSeen: Number(w.lastSeen) || 0,
        });
      }
    } else if (progress >= 50 || repetitions >= 1 || strength >= 2) {
      learningWords++;
      if (eng) {
        masteredCandidates.push({
          id: w.id || eng.toLowerCase(),
          english: eng,
          turkish: tr,
          audioUrl: w.audioUrl || "",
          strength: Math.max(strength, 2),
          lastSeen: Number(w.lastSeen) || 0,
        });
      }
    } else {
      newWords++;
    }
  });

  // En güçlü ve en güncel öğrenilen kelimeleri sırala
  masteredCandidates.sort((a, b) => b.strength - a.strength || b.lastSeen - a.lastSeen);
  const masteredWordsList = masteredCandidates.slice(0, 8);

  // Zayıf kelimeler
  const rawWeak = getWeakWords(vocabularyVault, quizHistory, {
    childId: resolvedChildId,
    limit: 6,
  });
  const weakWordsList = rawWeak
    .filter((w) => w && (w.english || w.word))
    .map((w) => ({
      id: w.id,
      english: String(w.english || w.word || "").trim(),
      turkish: String(w.turkish || w.meaning || "").trim(),
      audioUrl: w.audioUrl || "",
      reason: w.reason || "Tekrar bekliyor",
    }));

  // Son 7 günlük doğruluk / başarı oranı ve 7 günlük çalışma zinciri
  let recentCorrect = 0;
  let recentTotal = 0;
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const dailyMap = {};
  const todayDate = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = {
      dateKey: key,
      label: dayNames[d.getDay()],
      count: 0,
      correct: 0,
      active: false,
    };
  }

  (scopedHistory || []).forEach((h) => {
    const rawTime = h?.timestamp?.seconds ? h.timestamp.seconds * 1000 : Number(h?.timestamp) || 0;
    if (rawTime >= sevenDaysAgo) {
      recentTotal++;
      if (h.isCorrect) recentCorrect++;
      const d = new Date(rawTime);
      if (!isNaN(d.getTime())) {
        const key = d.toISOString().split("T")[0];
        if (dailyMap[key]) {
          dailyMap[key].count++;
          if (h.isCorrect) dailyMap[key].correct++;
          dailyMap[key].active = true;
        }
      }
    }
  });

  const dailyActivity7 = Object.values(dailyMap);
  const activeDaysLast7 = dailyActivity7.filter((d) => d.active).length;

  // Bugün çalışılan ve tekrar bekleyen kelimeler
  const todayStudied = countTodayStudiedWords(quizHistory, { childId: resolvedChildId });
  const dueReviewCount = countDueWords(vocabularyVault, { childId: resolvedChildId });
  const dailyTarget = Number(selectedChild?.dailyTarget) || 15;

  // Ölçülebilir aktivite yoksa: örnek / önizleme karnesi (sahte metrik yok)
  const isSample = totalWords === 0 && recentTotal === 0;

  let accuracyRate = 0;
  if (recentTotal > 0) {
    accuracyRate = Math.min(100, Math.round((recentCorrect / recentTotal) * 100));
  } else if (totalWords > 0) {
    accuracyRate = Math.min(
      100,
      Math.round((permanentWords / Math.max(1, totalWords)) * 100)
    );
  }

  // Seviye & Müfredat belirleme
  const { name: curriculumName, gradeKey } = resolveCurriculumInfo(
    selectedChild,
    lastPlayedLevel,
    activeStudyProfile
  );

  // Öğrenci İsmi
  const studentName =
    selectedChild?.name ||
    profile?.displayName ||
    profile?.email?.split("@")[0] ||
    "Genç Kaşif";

  // Evde "Akşam Yemeğinde Sorabileceğiniz 3 Kelime" havuzu
  const samplePool = GRADE_SAMPLE_WORDS[gradeKey] || GRADE_SAMPLE_WORDS["2"];
  const realQuizPool = masteredCandidates
    .filter((w) => w.english && w.turkish)
    .slice(0, 9)
    .map((w) => ({
      english: w.english,
      turkish: w.turkish,
      phonetic: "",
      audioUrl: w.audioUrl || "",
      isSampleWord: false,
    }));

  const familyQuizPool =
    realQuizPool.length >= 3
      ? realQuizPool
      : [
          ...realQuizPool,
          ...samplePool.map((s) => ({
            ...s,
            audioUrl: "",
            isSampleWord: true,
          })),
        ].slice(0, 6);

  // Pedagojik Değerlendirme Notu
  let pedagogicalNote = "";
  if (isSample) {
    pedagogicalNote = `Bu bir örnek karnedir. Öğrencimiz ${studentName} henüz ölçülebilir kelime çalışması kaydetmemiştir. Sınıf seçip 5–10 dakikalık bir oyun veya kelime kartı oturumu tamamlandığında gerçek başarı metrikleri ve öğrendiği kelimeler burada görünecektir.`;
  } else if (accuracyRate >= 90) {
    pedagogicalNote = `Tebrikler! Öğrencimiz ${studentName}, ${curriculumName} kapsamındaki kelimeleri üstün bir odaklanmayla çalışmış ve refleks düzeyinde kalıcı hafızasına aktarmıştır. Hafıza aralıklı tekrar (Memolandum Pulse™) algoritması başarıyla pekişmektedir. Günde 10 dakika pratik yapması bu kalıcılığı ömür boyu koruyacaktır.`;
  } else if (accuracyRate >= 75) {
    pedagogicalNote = `Harika İlerleme! Öğrencimiz ${studentName}, ${curriculumName} kelime setlerinde düzenli bir öğrenme grafiği sergilemektedir. Arcade oyunları ve kelime kartlarıyla kelimelerin anlamlarını ve sesli telaffuzlarını hızla pekiştirmektedir.`;
  } else if (totalWords > 0 || recentTotal > 0) {
    pedagogicalNote = `Güzel Başlangıç! Öğrencimiz ${studentName}, kelimeleri keşfetme aşamasındadır. Memolandum'un aralıklı tekrar mekanizması sayesinde zorlandığı kelimeler oyunlarda otomatik olarak karşısına çıkacak ve kalıcı hafızaya oturacaktır.`;
  } else {
    pedagogicalNote = `Ölçüm için biraz daha pratik gerekir. Kısa bir oyun veya kelime kartı oturumu sonrası karne gerçek verilerle güncellenir.`;
  }

  const reportDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    studentName,
    curriculumName,
    gradeKey,
    reportDate,
    totalWords,
    permanentWords,
    learningWords,
    newWords,
    mebWordsCount,
    accuracyRate,
    activeDaysLast7,
    dailyActivity7,
    todayStudied,
    dailyTarget,
    dueReviewCount,
    masteredWordsList,
    weakWordsList,
    familyQuizPool,
    joinedClassroom: joinedClassroom || null,
    level: globalStats?.level || 1,
    totalScore: globalStats?.total_score || 0,
    pedagogicalNote,
    isSample,
    childId: resolvedChildId || null,
  };
}

/**
 * 1200x840 Çözünürlükte Altın Mühürlü Resmi Başarı Karnesi (Canvas) Çizer
 */
export function generateCertificateCanvas(reportData) {
  if (typeof window === "undefined" || !document) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 1. Arka Plan (Derin Kozmik Lacivert / Slate Gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 840);
  bgGrad.addColorStop(0, "#080c16");
  bgGrad.addColorStop(0.5, "#0f172a");
  bgGrad.addColorStop(1, "#17143a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 840);

  // 2. Altın Çift Çerçeve (Gold Certificate Border)
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 780);

  ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, 1116, 756);

  // Köşe Altın Motifleri
  const drawCorner = (x, y, flipX, flipY) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(10, 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCorner(50, 50, false, false);
  drawCorner(1150, 50, true, false);
  drawCorner(50, 790, false, true);
  drawCorner(1150, 790, true, true);

  // 3. Başlık Alanı (Memolandum Mührü & Logosu)
  ctx.textAlign = "center";

  // Üst Küçük Rozet
  ctx.font = "bold 15px monospace";
  ctx.fillStyle = reportData.isSample ? "#f59e0b" : "#38bdf8";
  ctx.fillText(
    reportData.isSample
      ? "★ ÖRNEK KARNESİ — HENÜZ ÖLÇÜLEBİLİR VERİ YOK ★"
      : "★ 2026-2027 OKUL MÜFREDATINA UYUMLU BAŞARI BELGESİ ★",
    600,
    82
  );

  // Ana Logo / Başlık
  ctx.font = "900 42px sans-serif";
  const titleGrad = ctx.createLinearGradient(400, 95, 800, 145);
  titleGrad.addColorStop(0, "#ffffff");
  titleGrad.addColorStop(0.5, "#fbbf24");
  titleGrad.addColorStop(1, "#f59e0b");
  ctx.fillStyle = titleGrad;
  ctx.fillText("MEMOLANDUM AKADEMİ", 600, 134);

  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(
    reportData.isSample
      ? "ÖRNEK GELİŞİM KARNESİ (ÖNİZLEME)"
      : "ÖĞRENCİ GELİŞİM RAPORU & KALICI HAFIZA KARNESİ",
    600,
    166
  );

  // İnce Altın Çizgi
  ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 184);
  ctx.lineTo(850, 184);
  ctx.stroke();

  // 4. Öğrenci Bilgisi
  ctx.font = "italic 19px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Bu başarı belgesi, İngilizce kelime dağarcığını üstün gayretle geliştiren", 600, 222);

  // Öğrenci Adı (Vurgulu)
  ctx.font = "900 36px sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText(String(reportData.studentName || "Öğrenci").toUpperCase(), 600, 268);

  // Müfredat Adı & Sınıf Bilgisi
  ctx.font = "bold 19px sans-serif";
  ctx.fillStyle = "#e2e8f0";
  const classSuffix = reportData.joinedClassroom?.className
    ? ` (${reportData.joinedClassroom.className})`
    : "";
  ctx.fillText(
    `adına, ${reportData.curriculumName}${classSuffix} kapsamındaki çalışmaları için tanzim edilmiştir.`,
    600,
    302
  );

  // 5. Metrik Kartları (4 Kutucuk)
  const drawStatBox = (x, y, w, h, label, value, subtext, color) => {
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "900 32px sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(value, x + w / 2, y + 46);

    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + w / 2, y + 74);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(subtext, x + w / 2, y + 96);
    ctx.restore();
  };

  const boxW = 220;
  const boxH = 114;
  const boxY = 330;

  drawStatBox(
    110,
    boxY,
    boxW,
    boxH,
    "Kalıcı Hafızada",
    `${reportData.permanentWords} Kelime`,
    "SM-2 ile Pekiştirildi",
    "#34d399"
  );
  drawStatBox(
    360,
    boxY,
    boxW,
    boxH,
    "Başarı & Doğruluk",
    `%${reportData.accuracyRate}`,
    "Test & Oyun Doğruluğu",
    "#fbbf24"
  );
  drawStatBox(
    610,
    boxY,
    boxW,
    boxH,
    "Aktif Dağarcık",
    `${reportData.totalWords} Kelime`,
    "Toplam Öğrenme Havuzu",
    "#38bdf8"
  );
  drawStatBox(
    860,
    boxY,
    boxW,
    boxH,
    "Haftalık Ritim",
    `${reportData.activeDaysLast7 || 0}/7 Gün`,
    `Bugün: ${reportData.todayStudied || 0}/${reportData.dailyTarget || 15} Kelime`,
    "#a78bfa"
  );

  // 5.5. Öğrenilen Kelimeler Şeridi (Gerçek Kelime Vitrini)
  ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
  ctx.strokeStyle = "rgba(52, 211, 153, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(110, 462, 970, 62, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#34d399";
  const masteredSamples =
    Array.isArray(reportData.masteredWordsList) && reportData.masteredWordsList.length > 0
      ? reportData.masteredWordsList
          .slice(0, 5)
          .map((w) => (w.turkish ? `${w.english} (${w.turkish})` : w.english))
          .join("  •  ")
      : (reportData.familyQuizPool || [])
          .slice(0, 5)
          .map((w) => `${w.english} (${w.turkish})`)
          .join("  •  ");

  ctx.fillText(
    reportData.isSample
      ? "★ HEDEF MÜFREDAT KELİME ÖRNEKLERİ:"
      : "★ KALICI HAFIZAYA ALINAN KELİMELERDEN ÖRNEKLER:",
    132,
    485
  );
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(masteredSamples.slice(0, 95), 132, 509);

  // 6. Pedagojik Veli Notu Kutusu
  ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(110, 542, 970, 125, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText("📝 PEDAGOJİK GELİŞİM NOTU & VELİYE TAVSİYE:", 132, 570);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#cbd5e1";

  const wordsInNote = (reportData.pedagogicalNote || "").split(" ");
  let line = "";
  let lineY = 596;
  for (let n = 0; n < wordsInNote.length; n++) {
    const testLine = line + wordsInNote[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 920 && n > 0) {
      ctx.fillText(line, 132, lineY);
      line = wordsInNote[n] + " ";
      lineY += 22;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 132, lineY);

  // 7. Alt Bilgi & İmzalar
  ctx.textAlign = "left";
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`Rapor Tarihi: ${reportData.reportDate}`, 110, 745);

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(
    reportData.isSample
      ? "Örnek önizleme — ölçülebilir veri sonrası güncellenir"
      : "Veli & Öğrenci Takip Merkezi: memolandum.com/profile",
    110,
    767
  );

  // Altın Mühür Rozeti (Sağ Alt)
  ctx.textAlign = "right";
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText("Memolandum Pedagoji Kurulu Onaylı", 1080, 745);
  ctx.font = "12px monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("memolandum.com", 1080, 767);

  return canvas;
}

function triggerCanvasDownload(canvas, filename) {
  if (!canvas || typeof document === "undefined") return;
  const triggerLink = (href, revokeAfter = false) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = href;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (revokeAfter && typeof URL !== "undefined" && URL.revokeObjectURL) {
      setTimeout(() => URL.revokeObjectURL(href), 10000);
    }
  };

  if (typeof canvas.toBlob === "function" && typeof URL !== "undefined" && URL.createObjectURL) {
    canvas.toBlob((blob) => {
      if (blob) {
        triggerLink(URL.createObjectURL(blob), true);
      } else {
        triggerLink(canvas.toDataURL("image/png"), false);
      }
    }, "image/png");
    return;
  }
  triggerLink(canvas.toDataURL("image/png"), false);
}

/**
 * Karneyi PNG formatında kullanıcının cihazına indirir (Mobil Safari & Chrome Blob uyumlu)
 */
export function downloadCertificateImage(reportData) {
  const canvas = generateCertificateCanvas(reportData);
  if (!canvas) return;

  const fileNameSafe = (reportData.studentName || "Ogrenci").replace(/[^a-zA-Z0-9_-]/g, "_");
  const prefix = reportData.isSample ? "Memolandum_Ornek_Karne_" : "Memolandum_Basari_Karnesi_";
  triggerCanvasDownload(canvas, `${prefix}${fileNameSafe}.png`);
}

/**
 * WhatsApp Paylaşım Metni & URL'i Üretir
 */
export function getWhatsAppShareUrl(reportData) {
  const header = reportData.isSample
    ? `🎓 *MEMOLANDUM ÖRNEK KARNESİ* (önizleme — henüz gerçek veri yok) 🎓`
    : `🎓 *MEMOLANDUM BAŞARI KARNESİ* 🎓`;

  const wordSampleLine =
    !reportData.isSample &&
    Array.isArray(reportData.masteredWordsList) &&
    reportData.masteredWordsList.length > 0
      ? `\n✨ *Öğrendiği Kelimelerden Örnekler:* ${reportData.masteredWordsList
          .slice(0, 4)
          .map((w) => (w.turkish ? `${w.english} (${w.turkish})` : w.english))
          .join(", ")}`
      : "";

  const rhythmLine = !reportData.isSample
    ? `\n🔥 *Haftalık Çalışma Ritmi:* Son 7 günde ${reportData.activeDaysLast7 || 0} aktif gün`
    : "";

  const text = `${header}
👤 *Öğrenci:* ${reportData.studentName}
📚 *Müfredat:* ${reportData.curriculumName}
⭐ *Başarı Oranı:* %${reportData.accuracyRate}
🧠 *Kalıcı Hafızaya Alınan:* ${reportData.permanentWords} Kelime
🏆 *Toplam Dağarcık:* ${reportData.totalWords} Kelime${rhythmLine}${wordSampleLine}

_${reportData.pedagogicalNote}_

Detaylı gelişim karnesi ve oyunlaştırılmış İngilizce pratik için: https://memolandum.com`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Veli - Çocuk & Aile İçi Özel WhatsApp İletişim Şablonları
 * @param {Object} reportData
 * @param {'praise' | 'challenge' | 'family'} tone
 */
export function getWhatsAppParentBondMessage(reportData, tone = "praise") {
  const name = reportData?.studentName || "Canım Evladım";
  const curriculum = reportData?.curriculumName || "İngilizce";
  const permanent = reportData?.permanentWords || 0;
  const accuracy = reportData?.accuracyRate || 0;
  const quizWords = (reportData?.familyQuizPool || []).slice(0, 3);
  const quizListStr =
    quizWords.length > 0
      ? quizWords.map((w) => `*${w.english}*`).join(", ")
      : "*apple*, *book*, *school*";

  if (tone === "praise") {
    if (reportData?.isSample) {
      return `🌟 Canım ${name}, senin için Memolandum'da ${curriculum} profilini inceledim! Birlikte günde 10 dakika oyun oynayarak İngilizce kelimeleri kalıcı hafızana alabiliriz. Seninle gurur duyuyorum, hadi bugün ilk başarı karnemizi oluşturalım! 💪❤️ https://memolandum.com`;
    }
    return `🌟 Canım ${name}, Memolandum'daki ${curriculum} başarı karneni gördüm! Tam *${permanent} kelimeyi* kalıcı hafızana almışsın ve başarı oranın *%${accuracy}*. Gösterdiğin çaba ve azimle gurur duyuyorum, iyi ki varsın! 💪❤️🏆`;
  }

  if (tone === "challenge") {
    return `🎮 Selam şampiyon ${name}! Bugün Memolandum'da 5 dakikalık kısa bir kelime turu yapmaya ne dersin? Akşam seninle mini bir yarışma yapacağız, bakalım şu 3 kelimeyi bilecek misin: ${quizListStr} 😊🚀 https://memolandum.com`;
  }

  // 'family' (Aile Grubu / Eş / Büyükanne-Büyükbaba / Öğretmen)
  if (reportData?.isSample) {
    return `👨‍👩‍👧 *Aile Bilgilendirmesi:* ${name} için Memolandum (${curriculum}) takip sistemini açtık. İlk çalışma oturumu tamamlandığında haftalık başarı karnesini buradan paylaşacağız. 🌟 https://memolandum.com`;
  }
  const sampleWords =
    Array.isArray(reportData?.masteredWordsList) && reportData.masteredWordsList.length > 0
      ? `\n✨ *Son Öğrendiği Kelimeler:* ${reportData.masteredWordsList
          .slice(0, 4)
          .map((w) => (w.turkish ? `${w.english} (${w.turkish})` : w.english))
          .join(", ")}`
      : "";
  return `👨‍👩‍👧 *Ailemizin Gurur Tablosu — Memolandum Karnesi* 🎓\n\n🌟 *${name}*, ${curriculum} çalışmalarında *${permanent} kelimeyi* kalıcı hafızasına aldı ve *%${accuracy}* doğruluk oranına ulaştı!${sampleWords}\n\nDetaylar: https://memolandum.com`;
}

export function getWhatsAppParentBondUrl(reportData, tone = "praise") {
  const msg = getWhatsAppParentBondMessage(reportData, tone);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
}

/**
 * Veli bilgilendirme — yalnızca gerçek metriklerle (hardcode yok).
 */
export function getWhatsAppParentDigestUrl({
  reportData = null,
  studentName = "Öğrenci",
  curriculumName = "İlkokul İngilizce",
  activitySummary = "Ders oturumu tamamlandı",
  accuracyRate = 0,
  wordsCount = 0,
  permanentWords = 0,
  isSample = false,
} = {}) {
  const name = reportData?.studentName || studentName;
  const curriculum = reportData?.curriculumName || curriculumName;
  const rate = reportData?.accuracyRate ?? accuracyRate;
  const total = reportData?.totalWords ?? wordsCount;
  const permanent = reportData?.permanentWords ?? permanentWords;
  const sample = reportData?.isSample ?? isSample;

  const header = sample
    ? `📢 *MEMOLANDUM VELİ ÖZETİ* (örnek — henüz ölçülebilir veri yok)`
    : `📢 *MEMOLANDUM VELİ BİLGİLENDİRME ÖZETİ*`;

  const body = sample
    ? `Sayın Velimiz,

👦 *Öğrenci:* ${name}
🎒 *Sınıf / Düzey:* ${curriculum}
⏱️ *Son aktivite:* ${activitySummary}

Bu hafta henüz ölçülebilir çalışma kaydı yok. Kısa bir oyun veya kelime kartı oturumu sonrası gerçek karne oluşur.

Veli paneli: https://memolandum.com/profile`
    : `Sayın Velimiz,

👦 *Öğrenci:* ${name}
🎒 *Sınıf / Düzey:* ${curriculum}
⏱️ *Son aktivite:* ${activitySummary}
⭐ *Başarı oranı:* %${rate}
🧠 *Kalıcı hafızada:* ${permanent} kelime
📚 *Toplam dağarcık:* ${total} kelime

Detaylı başarı karnesi: https://memolandum.com/profile`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${header}\n${body}`)}`;
}

/** Manuel haftalık özet — mailto (otomatik gönderim yok). */
export function getParentDigestMailto({ reportData, recipientEmail = "" } = {}) {
  if (!reportData) return null;
  const subject = reportData.isSample
    ? `Memolandum örnek karne — ${reportData.studentName}`
    : `Memolandum veli özeti — ${reportData.studentName} (${reportData.reportDate})`;
  const body = reportData.isSample
    ? `Merhaba,\n\n${reportData.studentName} için henüz ölçülebilir çalışma kaydı yok.\nVeli paneli: https://memolandum.com/profile\n`
    : `Merhaba,\n\nÖğrenci: ${reportData.studentName}\nMüfredat: ${reportData.curriculumName}\nTarih: ${reportData.reportDate}\nBaşarı: %${reportData.accuracyRate}\nKalıcı kelime: ${reportData.permanentWords}\nToplam dağarcık: ${reportData.totalWords}\nHaftalık aktif gün: ${reportData.activeDaysLast7 || 0}/7\n\n${reportData.pedagogicalNote}\n\nVeli paneli: https://memolandum.com/profile\n`;
  const to = recipientEmail ? encodeURIComponent(recipientEmail) : "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Velinin doğrudan Memolandum Pedagoji Ekibine görüş / müfredat talebi / destek iletmesi için mailto linki
 */
export function getParentFeedbackMailto({
  parentName = "",
  studentName = "",
  curriculumName = "",
  topic = "Müfredat / Ünite Talebi",
  message = "",
} = {}) {
  const subject = `[Veli İletişim — ${topic}] ${studentName || "Öğrenci"} (${curriculumName || "Genel"})`;
  const body = `Merhaba Memolandum Pedagoji Ekibi,\n\nVeli Adı: ${parentName || "Belirtilmedi"}\nÖğrenci / Sınıf: ${studentName || "-"} / ${curriculumName || "-"}\nKonu: ${topic}\n\nMesajım:\n${message || ""}\n`;
  return `mailto:info@memolandum.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * İNOVASYON: Buzdolabı & Çalışma Masası Haftalık Kelime ve Aile Tekrar Fişi (1200x920 PNG)
 * Ekran kapalıyken bile mutfakta veya çalışma masasında Türkçe okunuş ipuçlarıyla kelime tekrarı sağlar.
 */
export async function downloadPrintableFridgeSheet(reportData) {
  if (typeof document === "undefined" || !reportData) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 920;
  const ctx = canvas.getContext("2d");

  // Açık renkli, yazıcı ve buzdolabı dostu temiz arka plan
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 1200, 920);

  // Dış Çerçeve
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 1152, 872);

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, 1132, 852);

  // Üst Başlık Bandı
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(34, 34, 1132, 115);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "900 18px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "🧲 MEMOLANDUM — EKRANSIZ AİLE TEKRAR & BUZDOLABI KELİME FİŞİ",
    600,
    72
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `${reportData.studentName || "Öğrenci"} · ${reportData.curriculumName || "İngilizce"}`,
    600,
    112
  );

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `Tarih: ${reportData.reportDate || "-"}   |   Kalıcı Kelime: ${reportData.permanentWords || 0}   |   Doğruluk: %${reportData.accuracyRate || 0}`,
    600,
    136
  );

  // 7 Günlük Akşam Yemeği "3 Kelime" Tik Çizelgesi
  ctx.fillStyle = "#fffbeb";
  ctx.fillRect(56, 170, 1088, 78);
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(56, 170, 1088, 78);

  ctx.fillStyle = "#92400e";
  ctx.font = "800 15px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    "📅 HAFTALIK 'EVDE 3 KELİME' AİLE TAKVİMİ (Her akşam 3 kelime sorup kutucuğu işaretleyin):",
    76,
    198
  );

  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  days.forEach((day, idx) => {
    const x = 76 + idx * 150;
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 214, 20, 20);
    ctx.fillStyle = "#1e293b";
    ctx.font = "700 15px system-ui, -apple-system, sans-serif";
    ctx.fillText(day, x + 28, 230);
  });

  // Kelime Havuzu Hazırlığı (10 Kelimeye Kadar — İki Sütun)
  const combinedMap = new Map();
  for (const w of reportData.weakWordsList || []) {
    if (w?.english) combinedMap.set(w.english.toLowerCase(), { ...w, tag: "Tekrar Et" });
  }
  for (const w of reportData.familyQuizPool || []) {
    if (w?.english && !combinedMap.has(w.english.toLowerCase())) {
      combinedMap.set(w.english.toLowerCase(), { ...w, tag: "Aile Oyunu" });
    }
  }
  for (const w of reportData.masteredWordsList || []) {
    if (w?.english && !combinedMap.has(w.english.toLowerCase())) {
      combinedMap.set(w.english.toLowerCase(), { ...w, tag: "Öğrendi" });
    }
  }

  const fallbackWords = [
    { english: "apple", turkish: "elma", phoneticHint: "ep-ıl", tag: "Örnek" },
    { english: "book", turkish: "kitap", phoneticHint: "buk", tag: "Örnek" },
    { english: "school", turkish: "okul", phoneticHint: "skuul", tag: "Örnek" },
    { english: "teacher", turkish: "öğretmen", phoneticHint: "tii-çır", tag: "Örnek" },
    { english: "friend", turkish: "arkadaş", phoneticHint: "frend", tag: "Örnek" },
    { english: "water", turkish: "su", phoneticHint: "vo-tır", tag: "Örnek" },
    { english: "family", turkish: "aile", phoneticHint: "fe-mi-li", tag: "Örnek" },
    { english: "happy", turkish: "mutlu", phoneticHint: "he-pi", tag: "Örnek" },
    { english: "morning", turkish: "sabah", phoneticHint: "mor-ning", tag: "Örnek" },
    { english: "pencil", turkish: "kurşun kalem", phoneticHint: "pen-sıl", tag: "Örnek" },
  ];

  const wordList = Array.from(combinedMap.values()).slice(0, 10);
  while (wordList.length < 10) {
    const nextFallback = fallbackWords[wordList.length];
    if (nextFallback) wordList.push(nextFallback);
    else break;
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 18px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    "🗣️ BU HAFTANIN HEDEF KELİMELERİ (İngilizce  •  Türkçe Okunuş İpucu  •  Anlamı)",
    56,
    284
  );

  // 2 Sütun halinde 10 kelime kartı çiz
  wordList.forEach((item, index) => {
    const col = index < 5 ? 0 : 1;
    const row = index % 5;
    const boxX = col === 0 ? 56 : 612;
    const boxY = 304 + row * 96;
    const boxW = 532;
    const boxH = 82;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Tik kutusu
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX + 18, boxY + 29, 24, 24);

    // İngilizce Kelime
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 22px system-ui, -apple-system, sans-serif";
    ctx.fillText(String(item.english || "").toUpperCase(), boxX + 56, boxY + 38);

    // Okunuş İpucu
    const hint =
      item.phonetic ||
      item.phoneticHint ||
      buildTurkishPhoneticHint(item.english) ||
      item.english ||
      "";
    ctx.fillStyle = "#0284c7";
    ctx.font = "700 14px system-ui, -apple-system, sans-serif";
    ctx.fillText(`Okunuşu: "${hint}"`, boxX + 56, boxY + 64);

    // Türkçe Anlamı
    ctx.fillStyle = "#059669";
    ctx.font = "800 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(item.turkish || ""), boxX + boxW - 20, boxY + 48);
    ctx.textAlign = "left";
  });

  // Alt Bilgi Bandı
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(56, 800, 1088, 64);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 15px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "🔊 Kelimelerin sesli telaffuzunu dinlemek ve 8 ücretsiz oyunla çalışmak için: memolandum.com   |   Veli Rehberi: memolandum.com/veli-rehberi",
    600,
    838
  );

  const safeName = String(reportData.studentName || "ogrenci")
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/g, "-");
  triggerCanvasDownload(canvas, `memolandum-buzdolabi-kelime-fisi-${safeName}.png`);
}

/**
 * İNOVASYON: Öğretmen → Veli WhatsApp Grubu Haftalık Ödev & Veli Rehberi Bülteni
 */
export function getTeacherParentGroupBulletinMessage(classroom = {}) {
  const className = classroom.className || "İngilizce Sınıfı";
  const teacherName = classroom.teacherName || "İngilizce Öğretmeni";
  const classCode = classroom.classCode || "MEMO";
  const assignmentTitle =
    classroom.currentAssignment?.unitName ||
    classroom.currentAssignment?.unitTitle ||
    classroom.currentAssignment?.title ||
    "Haftalık MEB Ünite Kelime Çalışması";

  return `📢 *${className} — Haftalık İngilizce Ödev & Aile Bilgilendirmesi* 🦉

Sayın Velilerimiz,
Öğrencilerimizle bu hafta Memolandum üzerinden *${assignmentTitle}* çalışmasını yapıyoruz.

🔑 *Sınıf Kodumuz:* ${classCode}
🎮 *Öğrenci Giriş Adresi:* https://memolandum.com/schools

👨‍👩‍👧 *Velilerimiz İçin 1 Dakikalık Rehber & Evde 3 Kelime Oyunu:*
İngilizce bilmeseniz bile çocuğunuzun öğrendiği kelimeleri sesli dinlemek, başarı karnesini görmek ve akşam yemeğinde 1 dakikalık *"3 Kelime Aile Oyunu"* oynamak için Veli Rehberimize göz atabilirsiniz (%100 ücretsiz ve reklamsızdır):
👉 https://memolandum.com/veli-rehberi

Sevgilerimle,
*${teacherName}*`;
}

export function getTeacherParentGroupBulletinUrl(classroom = {}) {
  const msg = getTeacherParentGroupBulletinMessage(classroom);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
}



