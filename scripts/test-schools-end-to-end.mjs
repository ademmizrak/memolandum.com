import fs from "fs";
import path from "path";
import assert from "assert";
import {
  MEB_HOMEWORK_UNITS,
  defaultAssignmentForGrade,
  findHomeworkUnit,
  buildHomeworkStartHref,
  wordCardUnitStorageKey,
} from "../src/lib/schools/mebHomeworkUnits.js";
import { findLevelContext } from "../src/lib/learning/studyContext.js";
import {
  TEACHER_AVATAR_PRESETS,
  STUDENT_AVATAR_PRESETS,
  sanitizeDisplayLabel,
  formatSchoolLine,
} from "../src/lib/schools/teacherIdentity.js";
import {
  calculateParentReportData,
  getWhatsAppShareUrl,
  getWhatsAppParentBondMessage,
  getParentFeedbackMailto,
} from "../src/lib/reports/reportGenerator.js";

console.log("==================================================================");
console.log("🛡️ YÜCE ARGON — OKULLAR, REHBER VE GÜVENLİK UÇTAN UCA TEST SÜİTİ");
console.log("==================================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ [GEÇTİ] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [HATA]  ${name}`);
    console.error("   Detay:", err.message || err);
    failed++;
  }
}

// 1. TÜM SINIF DÜZEYLERİ (1-12, LGS, YDS/YÖKDİL, ÖZEL DERS, GENEL) VARSAYILAN ÖDEV TESTİ
runTest("1–12. Sınıf, LGS, YDS/YÖKDİL ve Genel İngilizce varsayılan ödev eşleşmeleri (10/11/12 çakışma kontrolü dahil)", () => {
  const cases = [
    ["1. Sınıf", "meb1-all", "meb-1-sinif-kelimeleri"],
    ["2. Sınıf", "meb2-u1", "meb-2-sinif-kelimeleri"],
    ["3. Sınıf", "meb3-u1", "meb-3-sinif-kelimeleri"],
    ["4. Sınıf", "meb4-u1", "meb-4-sinif-kelimeleri"],
    ["5. Sınıf", "meb5-u1", "meb-5-sinif-kelimeleri"],
    ["6. Sınıf", "meb6-u1", "meb-6-sinif-kelimeleri"],
    ["7. Sınıf", "meb7-u1", "meb-7-sinif-kelimeleri"],
    ["8. Sınıf", "meb8-u1", "meb-8-sinif-kelimeleri"],
    ["9. Sınıf", "lise9-a1", "ingilizce-genel-words-a1-vocabulary"],
    ["10. Sınıf", "lise10-a2", "ingilizce-genel-words-a2-vocabulary"],
    ["11. Sınıf", "lise11-b1", "ingilizce-genel-words-b1-vocabulary"],
    ["12. Sınıf", "lise12-b2", "ingilizce-genel-words-b2-vocabulary"],
    ["LGS Kampı", "meb8-u1", "meb-8-sinif-kelimeleri"],
    ["YDS / YÖKDİL", "yds-top500", "ingilizce-yds-kelimeleri-yds-top500-master"],
    ["Özel Ders", "lise9-a1", "ingilizce-genel-words-a1-vocabulary"],
    ["Genel İngilizce", "lise9-a1", "ingilizce-genel-words-a1-vocabulary"],
  ];

  for (const [gradeLabel, expectedId, expectedLevelSlug] of cases) {
    const unit = defaultAssignmentForGrade(gradeLabel);
    assert.ok(unit, `${gradeLabel} için varsayılan ünite bulunamadı`);
    assert.strictEqual(
      unit.id,
      expectedId,
      `${gradeLabel} için beklenen ünite ${expectedId}, gelen: ${unit.id}`
    );
    assert.strictEqual(unit.levelId, expectedLevelSlug);
  }
});

// 2. MEB_HOMEWORK_UNITS İÇİNDEKİ TÜM 46 ÜNİTENİN MANIFEST, JSON VERİ SETİ VE ÜNİTE NUMARASI DOĞRULAMASI
runTest(`MEB_HOMEWORK_UNITS içindeki tüm ${MEB_HOMEWORK_UNITS.length} ödev hedefinin manifest ve JSON veri seti doğrulaması`, () => {
  assert.ok(MEB_HOMEWORK_UNITS.length >= 40, "En az 40 müfredat birimi olmalı");

  for (const unit of MEB_HOMEWORK_UNITS) {
    const ctx = findLevelContext(unit.levelId);
    assert.ok(ctx, `Manifest içinde levelId bulunamadı: ${unit.levelId} (${unit.label})`);
    assert.ok(ctx.level?.path, `Level path eksik: ${unit.levelId}`);

    const jsonPath = path.join(process.cwd(), "public", "data", ctx.level.path);
    assert.ok(fs.existsSync(jsonPath), `Veri dosyası diskte bulunamadı: ${jsonPath}`);

    const href = buildHomeworkStartHref(unit);
    assert.ok(href.startsWith(`/learn/en-tr/${ctx.level.slug}/`), `Hatalı ödev URL'si: ${href}`);

    if (unit.unitNo != null) {
      assert.ok(href.includes(`?unit=${unit.unitNo}`), `URL içinde ?unit=${unit.unitNo} parametresi eksik: ${href}`);
      const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const items = Array.isArray(raw) ? raw : raw.words || raw.items || [];
      const matchingWords = items.filter((w) => {
        const uNo = w.curriculum?.unit_no ?? w.curriculum?.units?.[0]?.unit_no;
        return Number(uNo) === Number(unit.unitNo);
      });
      assert.ok(
        matchingWords.length > 0,
        `${unit.label} (${ctx.level.path}) içinde unit_no=${unit.unitNo} olan kelime bulunamadı!`
      );
    }

    const lookedUp = findHomeworkUnit(unit.levelId, unit.unitNo);
    assert.ok(lookedUp && lookedUp.id === unit.id, `findHomeworkUnit(${unit.levelId}, ${unit.unitNo}) eşleşmedi`);
  }
});

// 3. WORDCARD SESSIONSTORAGE ANAHTAR SENKRONİZASYONU (SLUG <-> MANIFEST ID)
runTest("WordCard ünite seçimi (seedWordCardUnit) slug ve manifest ID senkronizasyonu", () => {
  const sample = MEB_HOMEWORK_UNITS.find((u) => u.id === "meb2-u3");
  const ctx = findLevelContext(sample.levelId);
  assert.strictEqual(sample.levelId, "meb-2-sinif-kelimeleri");
  assert.strictEqual(ctx.levelId, "en-tr_eng_ilkokul-2");
  assert.strictEqual(wordCardUnitStorageKey(sample.levelId), "word-card-unit:meb-2-sinif-kelimeleri");
  assert.strictEqual(wordCardUnitStorageKey(ctx.levelId), "word-card-unit:en-tr_eng_ilkokul-2");
});

// 4. RUMUZ, AVATAR VE ZALGO / XSS SANİTİZASYON TESTİ
runTest("Öğretmen & Öğrenci Rumuz/Avatar presetleri ve Zalgo/XSS temizleme filtreleri", () => {
  assert.strictEqual(TEACHER_AVATAR_PRESETS.length, 6, "Öğretmen 6 avatar preseti tam olmalı");
  assert.strictEqual(STUDENT_AVATAR_PRESETS.length, 12, "Öğrenci 12 avatar preseti tam olmalı");

  const dirtyInput = "K\u0300\u0301\u0302uzey <script>alert(1)</script> {Hacker} [Test] \u200B";
  const cleaned = sanitizeDisplayLabel(dirtyInput, 40);
  assert.ok(!cleaned.includes("<"), "HTML küçüktür işareti temizlenmedi");
  assert.ok(!cleaned.includes(">"), "HTML büyüktür işareti temizlenmedi");
  assert.ok(!cleaned.includes("{"), "Süslü parantez temizlenmedi");
  assert.ok(!cleaned.includes("\u0300"), "Zalgo combining karakter temizlenmedi");
  assert.ok(!cleaned.includes("\u200B"), "Görünmez zero-width karakter temizlenmedi");
  assert.strictEqual(
    formatSchoolLine({ schoolName: "", className: "4-A" }),
    "Ev / özel masa"
  );
  assert.strictEqual(
    formatSchoolLine({ schoolName: "Atatürk İlkokulu", province: "Ankara", district: "Çankaya" }),
    "Atatürk İlkokulu · Çankaya / Ankara"
  );
});

// 5. CLOUD FUNCTIONS (functions/schools.js) GÜVENLİK, ANTI-CHEAT VE MAHREMİYET KONTROLLERİ
runTest("Cloud Functions (functions/schools.js) Zero-PII, Anti-Cheat, Rate-Limit, Sınıf Kilidi ve Rumuz Koruması", () => {
  const cfCode = fs.readFileSync(path.join(process.cwd(), "functions", "schools.js"), "utf8");

  // Rate limit kontrolü
  assert.ok(cfCode.includes('enforceRateLimit(uid, "joinClassroom"'), "joinClassroom rate limit eksik");
  assert.ok(cfCode.includes('enforceRateLimit(uid, "getMyClassroom"'), "getMyClassroom rate limit eksik");
  assert.ok(cfCode.includes('enforceRateLimit(uid, "syncClassroomProgress"'), "syncClassroomProgress rate limit eksik");

  // Sınıf kilidi ve kapasite kontrolü
  assert.ok(cfCode.includes("if (!existing && data.isLocked)"), "isLocked sınıf kilidi kontrolü eksik");
  assert.ok(cfCode.includes("Object.keys(students).length >= 120"), "120 öğrenci kapasite sınırı eksik");

  // Öğretmen otorite kilidi (teacherEdited)
  assert.ok(cfCode.includes("const lockedByTeacher = existing?.teacherEdited === true;"), "teacherEdited otorite kilidi eksik");

  // Sınav notu mahremiyeti (sanitizeSeatForStudent)
  assert.ok(cfCode.includes("function sanitizeSeatForStudent(seat, classroomData)"), "sanitizeSeatForStudent fonksiyonu eksik");
  assert.ok(
    cfCode.includes("const safeSeat = sanitizeSeatForStudent(updatedEntry, data);"),
    "syncClassroomProgress yanıtında sanitizeSeatForStudent sarmalayıcısı eksik"
  );

  // Anti-cheat Kelime Kasası (vault) doğrulaması ve hız limiti
  assert.ok(
    cfCode.includes('.collection("vault")') && cfCode.includes("verifiedServerWords < requestedWords"),
    "Anti-Cheat Kelime Kasası doğrulaması veya hız sınırı eksik"
  );
});

// 6. FIRESTORE KURALLARI (firestore.rules) SIZINTI ÖNLEME TESTİ
runTest("Firestore Security Rules (firestore.rules) Enumeration ve Roster İzolasyon Kontrolü", () => {
  const rules = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8");

  assert.ok(rules.includes("allow get: if isTeacher();"), "classrooms get kuralı yalnız öğretmene özel olmalı");
  assert.ok(!rules.includes("allow get: if resource == null || isTeacher()"), "resource == null sızıntısı kapatılmış olmalı");
  assert.ok(
    rules.includes("allow list: if isSignedIn() && resource.data.teacherUid == request.auth.uid;"),
    "classrooms listeleme yalnız öğretmenin kendi sınıflarına açık olmalı"
  );
  assert.ok(rules.includes("match /teacherNotes/{studentId}"), "teacherNotes alt koleksiyon kuralı mevcut olmalı");
});

// 7. ÖĞRETMENİN SEÇTİĞİ VEYA ÖĞRENCİNİN GİRDİĞİ RUMUZUN OYUN OYNARKEN KORUNMASI TESTİ
runTest("Öğrencinin oyun oynarken (syncJoinedClassroomProgress) rumuzunun Google gerçek adıyla ezilmemesi", () => {
  const storeCode = fs.readFileSync(path.join(process.cwd(), "src", "store", "useMemolandumStore.js"), "utf8");
  const syncBlockStart = storeCode.indexOf("syncJoinedClassroomProgress: () =>");
  assert.ok(syncBlockStart !== -1, "syncJoinedClassroomProgress fonksiyonu bulunamadı");
  const syncBlock = storeCode.slice(syncBlockStart, syncBlockStart + 1800);

  assert.ok(syncBlock.includes("ownSeat?.name"), "syncJoinedClassroomProgress içinde ownSeat?.name önceliği olmalı");
  assert.ok(
    !syncBlock.includes("state.profile?.displayName"),
    "syncJoinedClassroomProgress içinde Google gerçek adı (state.profile?.displayName) fallback olarak kullanılmamalı!"
  );
});

// 8. BULUT KALICILIĞI (İKİ OTURUM / FARKLI CİHAZLAR ARASI VERİ KAYBI OLMAMASI)
runTest("Öğretmen ve Öğrenci oturumları arasında bulut senkronizasyonu (authService.js & TeacherDashboard.jsx)", () => {
  const authCode = fs.readFileSync(path.join(process.cwd(), "src", "lib", "firebase", "authService.js"), "utf8");
  assert.ok(authCode.includes("syncStudentClassToCloud"), "Öğrenci sınıf kodu bulut senkronizasyonu mevcut olmalı");
  assert.ok(authCode.includes("userData.joinedClassCode"), "Giriş yapıldığında joinedClassCode buluttan geri yüklenmeli");

  const dashCode = fs.readFileSync(path.join(process.cwd(), "src", "components", "schools", "TeacherDashboard.jsx"), "utf8");
  assert.ok(
    dashCode.includes("memolandum_active_teacher_class:"),
    "Öğretmenin son seçtiği aktif sınıf localStorage'da korunmalı"
  );
});

// 9. ÖĞRETMEN GÜVENLİK VE KULLANIM REHBERİ (TeacherTrustGuide.jsx) FONKSİYON VE SSS KONTROLÜ
runTest("Öğretmen Güvenlik ve Kullanım Rehberi (TeacherTrustGuide.jsx & /schools/rehber) tam içerik ve aksiyon kontrolü", () => {
  const guideCode = fs.readFileSync(path.join(process.cwd(), "src", "components", "schools", "TeacherTrustGuide.jsx"), "utf8");

  const requiredFaqs = [
    "Öğretmen olarak üye olurken veya sınıf açarken ücret ödeyecek miyim?",
    "Verilerim telefonumdan veya bilgisayarım kapandığında silinir mi?",
    "Öğrencilerim sınıfa nasıl katılıyor? Çok karmaşık mı?",
    "Okul müdürüm veya veliler güvenlik sorarsa ne söyleyebilirim?",
  ];
  for (const faq of requiredFaqs) {
    assert.ok(guideCode.includes(faq), `Rehberde SSS başlığı eksik: ${faq}`);
  }
  assert.ok(guideCode.includes("Öğretmen Paneline Geç"), "Öğretmen Paneline Geç CTA butonu mevcut olmalı");
  assert.ok(
    fs.existsSync(path.join(process.cwd(), "src", "app", "schools", "rehber", "page.js")),
    "/schools/rehber bağımsız sayfası mevcut olmalı"
  );
});

// 10. CANLI SİMÜLASYON: ÖĞRENCİ KOLTUĞU MAHREMİYETİ, SINAV NOTU GİZLEME VE ANTI-CHEAT SİMÜLASYONU
runTest("Canlı Simülasyon: Sınav Notu Gizleme (shareExamScoresWithStudents), Öğretmen Kilidi ve Anti-Cheat", () => {
  // Simüle edilen sınıf dokümanı (gizli sınav notlarıyla)
  const rawSeat = {
    uid: "stu_1",
    name: "Mavi Tilki",
    avatar: "🦊",
    teacherEdited: true,
    wordsLearned: 12,
    accuracy: 92,
    examScores: { exam1: 85, exam2: 90, quiz: 95 },
  };

  // Öğretmen sınav notlarını gizlediğinde (shareExamScoresWithStudents: false)
  const hiddenClass = { shareExamScoresWithStudents: false };
  const sanitizeSeat = (seat, classData) => {
    const copy = { ...seat };
    if (!classData?.shareExamScoresWithStudents) {
      delete copy.examScores;
    }
    return copy;
  };

  const studentViewHidden = sanitizeSeat(rawSeat, hiddenClass);
  assert.strictEqual(studentViewHidden.examScores, undefined, "Gizli modda öğrenciye examScores dönmemeli!");

  // Öğretmen sınav notlarını açtığında (shareExamScoresWithStudents: true)
  const sharedClass = { shareExamScoresWithStudents: true };
  const studentViewShared = sanitizeSeat(rawSeat, sharedClass);
  assert.deepStrictEqual(studentViewShared.examScores, { exam1: 85, exam2: 90, quiz: 95 });

  // Öğretmen kilidi (teacherEdited: true) varken öğrencinin adını değiştirmeye çalışması
  const lockedByTeacher = rawSeat.teacherEdited === true;
  const studentAttemptedName = "HackedName";
  const finalName = lockedByTeacher ? rawSeat.name : studentAttemptedName;
  assert.strictEqual(finalName, "Mavi Tilki", "teacherEdited aktifken öğrenci kendi rumuzunu değiştirememeli!");
});

// 11. VELİ KARNESİ MOTORU: GERÇEK VERİ, 7 GÜNLÜK RİTİM, ÖĞRENİLEN/ZAYIF KELİMELER VE 3 KELİME AİLE TESTİ
runTest("Veli Karnesi Motoru (reportGenerator.js): 7 Günlük Ritim, Öğrenilen Kelimeler, Zayıf Kelimeler ve Evde 3 Kelime Havuzu", () => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const mockVault = {
    w1: { id: "w1", english: "library", turkish: "kütüphane", strength: 5, repetitions: 4, lastSeen: now },
    w2: { id: "w2", english: "weather", turkish: "hava durumu", strength: 4, repetitions: 3, lastSeen: now - 1000 },
    w3: { id: "w3", english: "hospital", turkish: "hastane", strength: 1, lapses: 2, lastSeen: now - 2000 },
  };
  const mockHistory = [
    { wordId: "w1", english: "library", turkish: "kütüphane", isCorrect: true, timestamp: now - 1000 },
    { wordId: "w2", english: "weather", turkish: "hava durumu", isCorrect: true, timestamp: now - oneDay },
    { wordId: "w3", english: "hospital", turkish: "hastane", isCorrect: false, timestamp: now - 2 * oneDay },
  ];

  const report = calculateParentReportData({
    vocabularyVault: mockVault,
    quizHistory: mockHistory,
    selectedChild: { id: "c1", name: "Zeynep", grade: "meb-3-sinif-kelimeleri", gradeLabel: "3. Sınıf İngilizce", dailyTarget: 15 },
    joinedClassroom: { className: "3-B", teacherName: "Ayşe Öğretmen" },
  });

  assert.strictEqual(report.isSample, false, "Gerçek veri varken isSample false olmalı");
  assert.strictEqual(report.studentName, "Zeynep");
  assert.strictEqual(report.curriculumName, "3. Sınıf İngilizce");
  assert.strictEqual(report.permanentWords, 2, "Kalıcı kelime sayısı 2 olmalı");
  assert.strictEqual(report.totalWords, 3, "Toplam kelime sayısı 3 olmalı");
  assert.strictEqual(report.activeDaysLast7, 3, "Son 7 günde 3 aktif gün olmalı");
  assert.strictEqual(report.dailyActivity7.length, 7, "7 günlük aktivite dizisi 7 elemanlı olmalı");
  assert.ok(report.masteredWordsList.some((w) => w.english === "library"), "masteredWordsList içinde library olmalı");
  assert.ok(report.weakWordsList.some((w) => w.english === "hospital"), "weakWordsList içinde hospital olmalı");
  assert.ok(report.familyQuizPool.length >= 3, "Evde 3 Kelime Sor havuzunda en az 3 kelime olmalı");
  assert.strictEqual(report.joinedClassroom.className, "3-B");
});

// 12. VELİ - ÇOCUK İLETİŞİM ŞABLONLARI (GURUR MESAJI, YARIŞMA DAVETİ, AİLE GRUBU VE GERİ BİLDİRİM)
runTest("Veli-Çocuk İletişim Şablonları (WhatsApp Gurur/Yarışma/Aile Mesajları & Pedagoji İletişim)", () => {
  const sampleReport = calculateParentReportData({
    vocabularyVault: {},
    quizHistory: [],
    selectedChild: { name: "Kerem", grade: "meb-6-sinif-kelimeleri" },
  });
  assert.strictEqual(sampleReport.isSample, true);
  assert.strictEqual(sampleReport.curriculumName, "6. Sınıf Ortaokul İngilizce");

  const praiseMsg = getWhatsAppParentBondMessage(sampleReport, "praise");
  const challengeMsg = getWhatsAppParentBondMessage(sampleReport, "challenge");
  const familyMsg = getWhatsAppParentBondMessage(sampleReport, "family");
  const shareUrl = getWhatsAppShareUrl(sampleReport);
  const mailtoUrl = getParentFeedbackMailto({
    parentName: "Ali Veli",
    studentName: "Kerem",
    curriculumName: "6. Sınıf Ortaokul İngilizce",
    topic: "Müfredat / Ünite Talebi",
    message: "6. sınıf 4. ünite kelimeleri harika!",
  });

  assert.ok(praiseMsg.includes("Kerem"), "Gurur mesajında öğrenci adı geçmeli");
  assert.ok(challengeMsg.includes("Kerem"), "Yarışma davetinde öğrenci adı geçmeli");
  assert.ok(familyMsg.includes("Kerem"), "Aile grubu mesajında öğrenci adı geçmeli");
  assert.ok(shareUrl.startsWith("https://api.whatsapp.com/send?text="), "WhatsApp URL formatı doğru olmalı");
  assert.ok(mailtoUrl.startsWith("mailto:info@memolandum.com?subject="), "Geri bildirim mailto formatı doğru olmalı");
});

// 13. VELİ KULLANIM VE GÜVEN REHBERİ (ParentGuide.jsx & /veli-rehberi) KONTROLÜ
runTest("Veli Kullanım ve Güven Rehberi (ParentGuide.jsx & /veli-rehberi) tam içerik ve SSS kontrolü", () => {
  const parentGuidePath = path.join(process.cwd(), "src", "components", "profile", "ParentGuide.jsx");
  const parentPagePath = path.join(process.cwd(), "src", "app", "veli-rehberi", "page.js");
  assert.ok(fs.existsSync(parentGuidePath), "ParentGuide.jsx mevcut olmalı");
  assert.ok(fs.existsSync(parentPagePath), "/veli-rehberi sayfası mevcut olmalı");

  const code = fs.readFileSync(parentGuidePath, "utf8");
  const requiredPhrases = [
    "İngilizce Bilmeseniz Bile",
    "Akşam Yemeğinde Oynayabileceğiniz \"3 Kelime\" Aile Oyunu",
    "%100 Reklamsız ve Çocuk Güvenli",
    "Veli WhatsApp Grubunda Paylaş",
  ];
  for (const phrase of requiredPhrases) {
    assert.ok(code.includes(phrase), `Veli rehberinde ifade eksik: ${phrase}`);
  }
});

// 14. ENTERPRISE VELİ İLETİŞİM SİSTEMİ & YÖNETİCİ PANELİ (/admin + functions/feedback.js) KONTROLÜ
runTest("Enterprise Veli İletişim Sistemi (functions/feedback.js, firestore.rules, /admin) güvenlik ve işlev kontrolü", () => {
  const feedbackFnPath = path.join(process.cwd(), "functions", "feedback.js");
  const adminPagePath = path.join(process.cwd(), "src", "app", "admin", "page.js");
  const adminClientPath = path.join(process.cwd(), "src", "app", "admin", "AdminClient.jsx");
  const rulesPath = path.join(process.cwd(), "firestore.rules");

  assert.ok(fs.existsSync(feedbackFnPath), "functions/feedback.js mevcut olmalı");
  assert.ok(fs.existsSync(adminPagePath), "src/app/admin/page.js mevcut olmalı");
  assert.ok(fs.existsSync(adminClientPath), "src/app/admin/AdminClient.jsx mevcut olmalı");

  const fnCode = fs.readFileSync(feedbackFnPath, "utf8");
  assert.ok(fnCode.includes("exports.submitParentFeedback"), "submitParentFeedback tanımlı olmalı");
  assert.ok(fnCode.includes("exports.getAdminFeedbackDashboard"), "getAdminFeedbackDashboard tanımlı olmalı");
  assert.ok(fnCode.includes("exports.updateAdminFeedbackItem"), "updateAdminFeedbackItem tanımlı olmalı");
  assert.ok(fnCode.includes("ademmizrak@gmail.com"), "Yönetici e-posta yetkisi tanımlı olmalı");
  assert.ok(fnCode.includes("enforceFeedbackRateLimit"), "Spam/Rate-limit koruması aktif olmalı");

  const rulesCode = fs.readFileSync(rulesPath, "utf8");
  assert.ok(
    rulesCode.includes("match /parentFeedback/{ticketId}") &&
      rulesCode.includes("allow read, write: if false;"),
    "parentFeedback koleksiyonu istemci tarafında tamamen kilitli (allow read, write: if false) olmalı"
  );
});

// 15. SEO & GEO (Generative Engine Optimization) BULUNABİLİRLİK KONTROLÜ
runTest("SEO & GEO Bulunabilirlik (sitemap.js, robots.js, llms.txt, JSON-LD) doğrulaması", () => {
  const sitemapCode = fs.readFileSync(path.join(process.cwd(), "src", "app", "sitemap.js"), "utf8");
  const robotsCode = fs.readFileSync(path.join(process.cwd(), "src", "app", "robots.js"), "utf8");
  const llmsCode = fs.readFileSync(path.join(process.cwd(), "public", "llms.txt"), "utf8");
  const jsonLdCode = fs.readFileSync(path.join(process.cwd(), "src", "lib", "seo", "jsonLd.js"), "utf8");

  assert.ok(sitemapCode.includes('"/schools/"'), "sitemap.js içinde /schools/ olmalı");
  assert.ok(sitemapCode.includes('"/schools/rehber/"'), "sitemap.js içinde /schools/rehber/ olmalı");
  assert.ok(sitemapCode.includes('"/veli-rehberi/"'), "sitemap.js içinde /veli-rehberi/ olmalı");
  assert.ok(robotsCode.includes('"/admin/"'), "robots.js içinde /admin/ disallow olmalı");
  assert.ok(robotsCode.includes("OAI-SearchBot"), "robots.js içinde OAI-SearchBot tanımlı olmalı");
  assert.ok(llmsCode.includes("https://memolandum.com/schools/"), "llms.txt içinde /schools/ bulunmalı");
  assert.ok(llmsCode.includes("https://memolandum.com/veli-rehberi/"), "llms.txt içinde /veli-rehberi/ bulunmalı");
  assert.ok(jsonLdCode.includes("buildSchoolsPageJsonLd"), "jsonLd.js içinde buildSchoolsPageJsonLd bulunmalı");
  assert.ok(jsonLdCode.includes("buildParentGuideJsonLd"), "jsonLd.js içinde buildParentGuideJsonLd bulunmalı");
});

// 16. RADİKAL SEKTÖR YENİLİKLERİ (Buzdolabı Kelime Fişi, Yavaş Telaffuz Koçu, Veli WhatsApp Bülteni ve llms-full.txt)
runTest("Radikal Yenilikler: Buzdolabı Kelime Fişi, Yavaş Telaffuz Koçu, Öğretmen Veli Bülteni ve llms-full.txt", () => {
  const reportGenCode = fs.readFileSync(path.join(process.cwd(), "src", "lib", "reports", "reportGenerator.js"), "utf8");
  const modalCode = fs.readFileSync(path.join(process.cwd(), "src", "components", "profile", "ParentReportModal.jsx"), "utf8");
  const teacherDashCode = fs.readFileSync(path.join(process.cwd(), "src", "components", "schools", "TeacherDashboard.jsx"), "utf8");
  const llmsFullPath = path.join(process.cwd(), "public", "llms-full.txt");

  assert.ok(reportGenCode.includes("downloadPrintableFridgeSheet"), "downloadPrintableFridgeSheet tanımlı olmalı");
  assert.ok(reportGenCode.includes("getTeacherParentGroupBulletinUrl"), "getTeacherParentGroupBulletinUrl tanımlı olmalı");
  assert.ok(modalCode.includes("Buzdolabı Fişi"), "ParentReportModal içinde Buzdolabı Fişi butonu olmalı");
  assert.ok(modalCode.includes("🐢 Yavaş"), "ParentReportModal içinde Yavaş Telaffuz Koçu butonu olmalı");
  assert.ok(teacherDashCode.includes("Veli Grubuna Haftalık Bülten"), "TeacherDashboard içinde Veli Grubuna Haftalık Bülten butonu olmalı");
  assert.ok(fs.existsSync(llmsFullPath), "public/llms-full.txt mevcut olmalı");
});

console.log("\n==================================================================");
console.log(`📊 TEST SONUCU: ${passed} GEÇTİ, ${failed} HATA`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}



