const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.syncProgress = onCall({ region: "us-central1" }, async (request) => {
    // 1. Authenticate user
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Kullanıcı girişi yapılmalı.');
    }
    
    const uid = request.auth.uid;
    const { earnedGems, earnedScore, newWords } = request.data;

    // 2. Security Validations
    if (earnedGems > 100 || earnedScore > 5000) {
        throw new HttpsError('out-of-range', 'Şüpheli skor aktivitesi algılandı.');
    }

    // Sanitize input
    const safeGems = Number.isInteger(earnedGems) ? Math.max(0, earnedGems) : 0;
    const safeScore = Number.isInteger(earnedScore) ? Math.max(0, earnedScore) : 0;
    const safeWords = Array.isArray(newWords) ? newWords : [];

    // 3. Update Database
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    
    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            let currentData = doc.exists ? doc.data() : { gems: 0, scores: 0, learnedWords: [], unlockedLevels: 1, playTime: 0 };
            
            const mergedWords = [...new Set([...(currentData.learnedWords || []), ...safeWords])];
            
            t.set(userRef, {
                gems: (currentData.gems || 0) + safeGems,
                scores: (currentData.scores || 0) + safeScore,
                learnedWords: mergedWords,
                displayName: request.auth.token.name || request.auth.token.email?.split('@')[0] || "CADET",
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // Also update leaderboard safely using increment if score is gained
        if (safeScore > 0) {
            const leaderboardRef = db.collection('leaderboard').doc(uid);
            await leaderboardRef.set({
                high_score: FieldValue.increment(safeScore),
                displayName: request.auth.token.name || request.auth.token.email?.split('@')[0] || "CADET",
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });
        }

        return { success: true, message: 'İlerleme güvenli şekilde kaydedildi.' };
    } catch (error) {
        console.error("Progress sync error:", error);
        throw new HttpsError('internal', 'Veritabanı güncellenirken hata oluştu.');
    }
});

exports.updateScore = onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Kullanıcı girişi yapılmalı.');
    }
    
    const uid = request.auth.uid;
    const { score, displayName } = request.data;

    const safeScore = Number.isInteger(score) ? Math.max(0, score) : 0;
    
    if (safeScore > 5000) {
        throw new HttpsError('out-of-range', 'Şüpheli skor algılandı.');
    }

    if (safeScore === 0) return { success: true };

    const db = getFirestore();
    const leaderboardRef = db.collection('leaderboard').doc(uid);
    
    try {
        await leaderboardRef.set({
            high_score: FieldValue.increment(safeScore),
            displayName: displayName || "CADET",
            lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true });
        
        return { success: true, message: 'Skor başarıyla eklendi.' };
    } catch (error) {
        console.error("updateScore error:", error);
        throw new HttpsError('internal', 'Skor güncellenirken hata oluştu.');
    }
});

const fs = require('fs');
const path = require('path');

exports.ssr = onRequest({ region: "us-central1" }, async (req, res) => {
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  
  const botKeywords = [
    "googlebot", "bingbot", "yandexbot", "duckduckbot", "baiduspider",
    "twitterbot", "facebookexternalhit", "linkedinbot", "embedly",
    "quora link preview", "rogue", "markdownbot", "chatgpt", "gptbot",
    "applebot", "gemini", "google-co-op", "google-extended"
  ];
  
  const isBot = botKeywords.some(keyword => userAgent.includes(keyword)) || req.query.bot === "true";
  
  if (!isBot) {
    const indexPath = path.join(__dirname, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.status(200).sendFile(indexPath);
    } else {
      return res.status(404).send("index.html not found in functions directory.");
    }
  }

  const requestPath = req.path || "";
  let slug = "";
  if (requestPath.startsWith("/oyna/")) {
    slug = requestPath.replace("/oyna/", "").replace(/\/$/, "");
  } else if (requestPath.startsWith("/kategori/")) {
    slug = requestPath.replace("/kategori/", "").replace(/\/$/, "");
  }

  const manifestPath = path.join(__dirname, "data_manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return res.status(500).send("data_manifest.json not found.");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  function slugifyCategoryPath(filePath) {
    if (!filePath) return "";
    let name = filePath.replace(".json", "");
    name = name.replace("Tr_Eng_", "Ingilizce_");
    name = name.replace("spanish", "Ispanyolca");
    name = name.replace("french", "Fransizca");
    name = name.replace("german", "Almanca");
    name = name.replace("italian", "Italyanca");
    name = name.replace("russian", "Rusca");
    name = name.replace("portuguese", "Portekizce");
    name = name.replace("portugal", "Portekizce");
    name = name.replace("korean", "Korece");
    name = name.replace("Kore", "Korece");
    name = name.replace("ottoman", "Osmanlica");
    name = name.replace("Osm_Tr", "Osmanlica");
    name = name.replace("greek", "Yunanca");
    name = name.replace("Greek", "Yunanca");
    
    return name.toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getPathFromSlug(s) {
    if (!s) return null;
    const allFiles = [];
    if (manifest.singleLanguages) {
      manifest.singleLanguages.forEach(l => l.files.forEach(f => allFiles.push(f)));
    }
    if (manifest.englishCategories) {
      manifest.englishCategories.forEach(c => c.files.forEach(f => allFiles.push(f)));
    }
    
    const normalized = s.toLowerCase();
    for (let f of allFiles) {
      if (slugifyCategoryPath(f.path) === normalized) return f;
      
      // Fallback: match legacy/direct path slug format (e.g. tr-eng-genel-a2-words)
      const legacySlug = f.path.replace('.json', '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (legacySlug === normalized) return f;
    }
    return null;
  }

  const matchedFile = getPathFromSlug(slug);

  if (!matchedFile) {
    const indexPath = path.join(__dirname, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.status(200).sendFile(indexPath);
    }
    return res.status(404).send("Page not found");
  }

  // Load database from local or fallback to GCS
  const categoryWordsPath = path.join(__dirname, "data", matchedFile.path);
  let words = [];
  
  if (fs.existsSync(categoryWordsPath)) {
    try {
      words = JSON.parse(fs.readFileSync(categoryWordsPath, "utf8"));
    } catch (err) {
      return res.status(500).send(`Error parsing local JSON database: ${err.message}`);
    }
  } else {
    const bucketBase = "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data";
    const fetchUrl = `${bucketBase}/${matchedFile.path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
    
    try {
      const response = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        words = await response.json();
      } else {
        return res.status(404).send(`Data file not found on bucket: ${matchedFile.path}`);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      const isTimeout = e.name === 'AbortError';
      return res.status(isTimeout ? 504 : 500).send(
        isTimeout ? "Timeout fetching database from storage." : `Error fetching database from bucket: ${e.message}`
      );
    }
  }

  // Unpack structured data formats (nested Chinese / vocabulary vaults)
  let rawWords = [];
  if (Array.isArray(words)) {
    if (words.length > 0 && words[0].words && Array.isArray(words[0].words)) {
      if (matchedFile.levelCode) {
        const targetLvl = words.find(item => item.level === matchedFile.levelCode || item.level_tag === matchedFile.levelCode);
        rawWords = targetLvl ? targetLvl.words : [];
      } else {
        rawWords = words.flatMap(item => item.words || []);
      }
    } else {
      rawWords = words;
    }
  } else if (words && words.words) {
    rawWords = words.words;
  } else if (words && words.phrase_vault) {
    rawWords = words.phrase_vault;
  } else if (words && words.vocabulary_vault) {
    rawWords = words.vocabulary_vault;
  } else {
    rawWords = Object.values(words);
  }

  // Filter flat list by levelCode if specified
  if (matchedFile.levelCode && !(Array.isArray(words) && words.length > 0 && words[0].words && Array.isArray(words[0].words))) {
    const targetCode = matchedFile.levelCode.toLowerCase();
    rawWords = rawWords.filter(w => {
      const tags = [
        w.level,
        w.level_tag,
        w.category,
        ...(Array.isArray(w.tags) ? w.tags : (w.tags ? [w.tags] : []))
      ].filter(Boolean).map(t => String(t).toLowerCase());
      
      return tags.includes(targetCode);
    });
  }

  const directionLabel = matchedFile.directionLabelTR || matchedFile.directionLabel || "";
  const title = `Memolandum | ${matchedFile.label} (${directionLabel}) | Oyna, Ezberle - Kelime Öğrenme Oyunu`;
  const description = `Memolandum ile retro arcade oyunları oynayarak ${matchedFile.label} (${directionLabel}) kelimelerini eğlenceli şekilde ezberleyin. Oyna, Ezberle!`;

  let tableRows = "";
  rawWords.forEach((w, index) => {
    const original = w.word || w.original_script || w.english || w.en || w.osmanlica_latin || w.hanzi || w.kanji || w.character || w.character_script || w.root || "";
    const translation = w.translation || w.meaning || w.turkish || w.tr || w.guncel_turkce || 
                        w.es || w.fr || w.de || w.ar || w.pt || w.brpt || w.zh || w.cn || w.it || w.ru || w.ja || w.jap || w.ko || w.el || w.type || "";
    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${original}</strong></td>
        <td>${translation}</td>
        <td>${w.pos || "N/A"}</td>
      </tr>`;
  });

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="keywords" content="${matchedFile.label}, ${directionLabel}, kelime ezberleme oyunu, memolandum, ingilizce öğrenme">
  <link rel="canonical" href="https://memolandum.com/oyna/${slug}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://memolandum.com/oyna/${slug}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://memolandum.com/memolandum_preview.png">
  <meta property="og:site_name" content="Memolandum">

  <!-- JSON-LD for SEO & AI Crawlers -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "EducationalApplication",
    "name": "Memolandum - ${matchedFile.label}",
    "description": "${description}",
    "applicationCategory": "EducationalGame",
    "genre": "Vocabulary Training",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0a0f1d; color: #e2e8f0; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #38bdf8; border-bottom: 2px solid #1e293b; padding-bottom: 10px; font-size: 24px; }
    p { color: #94a3b8; font-size: 14px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    th, td { border: 1px solid #1e293b; padding: 12px; text-align: left; }
    th { background-color: #0f172a; color: #38bdf8; font-weight: bold; }
    tr:nth-child(even) { background-color: #0f172a; }
    tr:hover { background-color: #1e293b; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #1e293b; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>Memolandum - ${matchedFile.label} (${directionLabel})</h1>
  <p>${description} Bu sayfa arama motorları ve AI tarayıcılar için oluşturulmuş statik bir kelime listesidir. Oyunu tarayıcınızda interaktif olarak oynamak için <a href="https://memolandum.com/oyna/${slug}" style="color: #38bdf8; text-decoration: underline;">Memolandum'a giriş yapın</a>.</p>
  
  <table>
    <thead>
      <tr>
        <th style="width: 8%;">Sıra No</th>
        <th style="width: 35%;">Kelime / İfade</th>
        <th style="width: 35%;">Anlamı / Karşılığı</th>
        <th style="width: 22%;">Sözcük Türü (POS)</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div class="footer">
    &copy; ${new Date().getFullYear()} Memolandum. Oyna, Ezberle! Tüm hakları saklıdır.
  </div>
</body>
</html>`;

    return res.status(200).send(html);
  });

// Evrensel Döngü Engelleyici (Guard Clause) Şablonu
exports.processUserProgress = onDocumentWritten("users/{userId}/progress/{progressId}", async (event) => {
    // 1. Döküman silinmişse işlemi sonlandır
    if (!event.data.after.exists) {
        return null;
    }

    const newData = event.data.after.data();

    // 2. GUARD CLAUSE: Eğer veri zaten işlenmişse fonksiyonu DERHAL sonlandır (Infinite Loop Koruması)
    if (newData.processed === true) {
        console.log("Belge zaten işlendi, fonksiyon sonlandırılıyor.");
        return null;
    }

    // 3. İşlemlerinizi burada yapın (Skor hesaplama vb.)
    // ... örneğin: const bonusScore = newData.score * 2; ...

    // 4. İşlem bittikten sonra belgeyi 'processed: true' olarak güncelle.
    // merge: true ile sadece bu alanı güncelliyoruz, diğer alanlar bozulmuyor.
    return event.data.after.ref.set({
        processed: true,
        // bonusScore: bonusScore,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
});
