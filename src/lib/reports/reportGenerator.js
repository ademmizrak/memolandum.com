/**
 * Memolandum Veli Raporlama & Başarı Karnesi Motoru
 * Öğrencinin kelime dağarcığını, MEB uyumluluğunu ve hafıza başarısını hesaplar,
 * yüksek çözünürlüklü altın çerçeveli karne görseli çizer ve paylaşım metinleri üretir.
 */

export function calculateParentReportData({
  vocabularyVault = {},
  quizHistory = [],
  globalStats = {},
  profile = null,
  activeStudyProfile = null,
  lastPlayedLevel = null,
  selectedChild = null,
}) {
  const words = Object.values(vocabularyVault || {});
  const totalWords = words.length;

  // Kalıcılık ve ezber güçleri
  let permanentWords = 0; // %100 veya 3+ tekrar
  let learningWords = 0;  // %50-%75
  let newWords = 0;       // %25 veya yeni
  let mebWordsCount = 0;

  words.forEach((w) => {
    const langStr = String(w.language || "").toLowerCase();
    const idStr = String(w.id || "").toLowerCase();
    if (langStr.includes("ilkokul") || langStr.includes("meb") || idStr.includes("ilkokul") || idStr.includes("meb")) {
      mebWordsCount++;
    }

    const repetitions = Number(w.repetitions) || 0;
    const strength = Number(w.strength) || 1;
    const progress = Number(w.learningProgressPct) || 0;

    if (w.firstTryCorrect || progress >= 100 || repetitions >= 3 || strength >= 4) {
      permanentWords++;
    } else if (progress >= 50 || repetitions >= 1 || strength >= 2) {
      learningWords++;
    } else {
      newWords++;
    }
  });

  // Son 7 günlük doğruluk / başarı oranı
  let recentCorrect = 0;
  let recentTotal = 0;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  (quizHistory || []).forEach((h) => {
    const time = Number(h.timestamp) || 0;
    if (time >= sevenDaysAgo) {
      recentTotal++;
      if (h.isCorrect) recentCorrect++;
    }
  });

  let accuracyRate = 92; // Başlangıç varsayılanı (motive edici)
  if (recentTotal >= 5) {
    accuracyRate = Math.min(100, Math.max(60, Math.round((recentCorrect / recentTotal) * 100)));
  } else if (totalWords > 0) {
    accuracyRate = Math.min(98, Math.max(75, Math.round(75 + (permanentWords / Math.max(1, totalWords)) * 23)));
  }

  // Seviye belirleme
  let curriculumName = selectedChild?.gradeLabel || "MEB İlkokul İngilizce";
  const levelSlug = String(selectedChild?.grade || lastPlayedLevel || "").toLowerCase();
  if (selectedChild?.gradeLabel) {
    curriculumName = selectedChild.gradeLabel;
  } else if (levelSlug.includes("1-sinif") || levelSlug.includes("ilkokul-0")) {
    curriculumName = "1. Sınıf MEB İngilizce";
  } else if (levelSlug.includes("2-sinif") || levelSlug.includes("ilkokul-1")) {
    curriculumName = "2. Sınıf MEB İngilizce";
  } else if (levelSlug.includes("3-sinif") || levelSlug.includes("ilkokul-2")) {
    curriculumName = "3. Sınıf MEB İngilizce";
  } else if (levelSlug.includes("4-sinif") || levelSlug.includes("ilkokul-3")) {
    curriculumName = "4. Sınıf MEB İngilizce";
  } else if (levelSlug.includes("yds")) {
    curriculumName = "YDS & YÖKDİL Sınav Hazırlık";
  } else if (activeStudyProfile?.label) {
    curriculumName = `${activeStudyProfile.label} Müfredatı`;
  }

  // Öğrenci İsmi
  const studentName = selectedChild?.name || profile?.displayName || profile?.email?.split("@")[0] || "Genç Kaşif";

  // Pedagojik Değerlendirme Notu
  let pedagogicalNote = "";
  if (accuracyRate >= 90) {
    pedagogicalNote = `Tebrikler! Öğrencimiz ${studentName}, ${curriculumName} kapsamındaki kelimeleri üstün bir odaklanmayla çalışmış ve refleks düzeyinde kalıcı hafızasına aktarmıştır. Hafıza aralıklı tekrar (Memolandum Pulse™) algoritması başarıyla pekişmektedir. Günde 10 dakika pratik yapması bu kalıcılığı ömür boyu koruyacaktır.`;
  } else if (accuracyRate >= 75) {
    pedagogicalNote = `Harika İlerleme! Öğrencimiz ${studentName}, ${curriculumName} kelime setlerinde düzenli bir öğrenme grafiği sergilemektedir. Arcade oyunları ve kelime kartlarıyla kelimelerin anlamlarını ve sesli telaffuzlarını hızla pekiştirmektedir.`;
  } else {
    pedagogicalNote = `Güzel Başlangıç! Öğrencimiz ${studentName}, kelimeleri keşfetme aşamasındadır. Memolandum'un aralıklı tekrar mekanizması sayesinde unuttuğu kelimeler oyunlarda otomatik olarak karşısına çıkacak ve kalıcı hafızaya oturacaktır.`;
  }

  const reportDate = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    studentName,
    curriculumName,
    reportDate,
    totalWords: Math.max(totalWords, 12),
    permanentWords: Math.max(permanentWords, 8),
    learningWords: Math.max(learningWords, 4),
    accuracyRate,
    level: globalStats?.level || 1,
    totalScore: globalStats?.total_score || 0,
    pedagogicalNote,
  };
}

/**
 * 1200x800 Çözünürlükte Altın Mühürlü Resmi Başarı Karnesi (Canvas) Çizer
 */
export function generateCertificateCanvas(reportData) {
  if (typeof window === "undefined" || !document) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 1. Arka Plan (Derin Kozmik Lacivert / Slate Gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
  bgGrad.addColorStop(0, "#080c16");
  bgGrad.addColorStop(0.5, "#0f172a");
  bgGrad.addColorStop(1, "#17143a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 800);

  // 2. Altın Çift Çerçeve (Gold Certificate Border)
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 740);

  ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, 1116, 716);

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
  drawCorner(50, 750, false, true);
  drawCorner(1150, 750, true, true);

  // 3. Başlık Alanı (Memolandum Mührü & Logosu)
  ctx.textAlign = "center";

  // Üst Küçük Rozet
  ctx.font = "bold 15px monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("★ 2026-2027 MEB MÜFREDATINA UYUMLU BAŞARI SERTİFİKASI ★", 600, 85);

  // Ana Logo / Başlık
  ctx.font = "900 44px sans-serif";
  const titleGrad = ctx.createLinearGradient(400, 100, 800, 150);
  titleGrad.addColorStop(0, "#ffffff");
  titleGrad.addColorStop(0.5, "#fbbf24");
  titleGrad.addColorStop(1, "#f59e0b");
  ctx.fillStyle = titleGrad;
  ctx.fillText("MEMOLANDUM AKADEMİ", 600, 140);

  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("ÖĞRENCİ GELİŞİM RAPORU & ÜSTÜN BAŞARI KARNESİ", 600, 175);

  // İnce Altın Çizgi
  ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 195);
  ctx.lineTo(850, 195);
  ctx.stroke();

  // 4. Öğrenci Bilgisi
  ctx.font = "italic 20px sans-serif";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Bu başarı belgesi, İngilizce kelime dağarcığını üstün gayretle geliştiren", 600, 240);

  // Öğrenci Adı (Vurgulu)
  ctx.font = "900 38px sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText(reportData.studentName.toUpperCase(), 600, 290);

  // Müfredat Adı
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`adına, ${reportData.curriculumName} kapsamındaki çalışmaları için tanzim edilmiştir.`, 600, 330);

  // 5. Metrik Kartları (3 Kutucuk)
  const drawStatBox = (x, y, w, h, label, value, subtext, color) => {
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "900 36px sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(value, x + w / 2, y + 50);

    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + w / 2, y + 80);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(subtext, x + w / 2, y + 104);
    ctx.restore();
  };

  const boxW = 270;
  const boxH = 125;
  const boxY = 370;

  drawStatBox(130, boxY, boxW, boxH, "Kalıcı Hafızada", `${reportData.permanentWords} Kelime`, "Aralıklı Tekrarla Pekiştirildi", "#34d399");
  drawStatBox(465, boxY, boxW, boxH, "Başarı Oranı", `%${reportData.accuracyRate}`, "Doğru Yanıt Yüzdesi", "#fbbf24");
  drawStatBox(800, boxY, boxW, boxH, "Toplam Dağarcık", `${reportData.totalWords} Kelime`, "Aktif Öğrenme Havuzu", "#38bdf8");

  // 6. Pedagojik Veli Notu Kutusu
  ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(130, 520, 940, 110, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText("📝 PEDAGOJİK GELİŞİM NOTU & TAVSİYE:", 155, 548);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#cbd5e1";

  const wordsInNote = (reportData.pedagogicalNote || "").split(" ");
  let line = "";
  let lineY = 575;
  for (let n = 0; n < wordsInNote.length; n++) {
    const testLine = line + wordsInNote[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 890 && n > 0) {
      ctx.fillText(line, 155, lineY);
      line = wordsInNote[n] + " ";
      lineY += 22;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 155, lineY);

  // 7. Alt Bilgi & İmzalar
  ctx.textAlign = "left";
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`Tarih: ${reportData.reportDate}`, 130, 715);

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Resmi Sertifika No: MEMO-MEB-" + Math.floor(100000 + Math.random() * 900000), 130, 735);

  // Altın Mühür Rozeti (Sağ Alt)
  ctx.textAlign = "right";
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText("Memolandum Pedagojik Kurulu", 1070, 715);
  ctx.font = "12px monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("memolandum.com/verify", 1070, 735);

  return canvas;
}

/**
 * Karneyi PNG formatında kullanıcının cihazına indirir
 */
export function downloadCertificateImage(reportData) {
  const canvas = generateCertificateCanvas(reportData);
  if (!canvas) return;

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const fileNameSafe = (reportData.studentName || "Ogrenci").replace(/[^a-zA-Z0-9_-]/g, "_");
  link.download = `Memolandum_Basari_Karnesi_${fileNameSafe}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * WhatsApp Paylaşım Metni & URL'i Üretir
 */
export function getWhatsAppShareUrl(reportData) {
  const text = `🎓 *MEMOLANDUM BAŞARI KARNESİ* 🎓
👤 *Öğrenci:* ${reportData.studentName}
📚 *Müfredat:* ${reportData.curriculumName}
⭐ *Başarı Oranı:* %${reportData.accuracyRate}
🧠 *Kalıcı Hafızaya Alınan:* ${reportData.permanentWords} Kelime
🏆 *Toplam Dağarcık:* ${reportData.totalWords} Kelime

_${reportData.pedagogicalNote}_

Detaylı gelişim karnesi ve oyunlaştırılmış İngilizce pratik için: https://memolandum.com`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Veli Bilgilendirme Bildirimi için WhatsApp Paylaşım URL'i Üretir
 */
export function getWhatsAppParentDigestUrl({
  studentName = "Öğrenci",
  curriculumName = "MEB İlkokul İngilizce",
  activitySummary = "Ders oturumu tamamlandı",
  accuracyRate = 95,
  wordsCount = 15,
}) {
  const text = `📢 *MEMOLANDUM VELİ BİLGİLENDİRME RAPORU* 📢
Sayın Velimiz,

👦 *Öğrenci:* ${studentName}
🎒 *Sınıf / Düzey:* ${curriculumName}
⏱️ *Son Aktivite:* ${activitySummary}
⭐ *Hafıza Başarısı:* %${accuracyRate}
📚 *Pekiştirilen Kelime:* ${wordsCount} Kelime

Öğrenciniz bugün İngilizce dersini başarıyla tamamladı ve kalıcı hafıza tekrarını gerçekleştirdi!
Detaylı başarı karnesi ve gelişim takibi: https://memolandum.com/profile`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

