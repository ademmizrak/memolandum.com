const admin = require('firebase-admin');

// IMPORTANT: To run this script locally, you must have GOOGLE_APPLICATION_CREDENTIALS environment variable set
// pointing to your Firebase Service Account JSON file. 

try {
  // Eğer serviceAccountKey.json dosyanız functions klasörünün içindeyse:
  const fs = require('fs');
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }
} catch (error) {
  console.error("Firebase Admin başlatılamadı. GOOGLE_APPLICATION_CREDENTIALS ayarlı mı?");
  process.exit(1);
}

const db = admin.firestore();

const seedData = [
  { id: "kadet_01", displayName: "NeonRunner", high_score: 2850 },
  { id: "kadet_02", displayName: "CyberWizard", high_score: 2400 },
  { id: "kadet_03", displayName: "DataGhost", high_score: 1950 },
  { id: "kadet_04", displayName: "GlitchKing", high_score: 1200 },
  { id: "kadet_05", displayName: "CodeBreaker", high_score: 850 }
];

async function seedLeaderboard() {
  console.log("Leaderboard Seeder başlatılıyor...");

  try {
    const leaderboardRef = db.collection('leaderboard');
    
    // 1. Veritabanı boş mu kontrol et
    const snapshot = await leaderboardRef.limit(1).get();
    
    if (!snapshot.empty) {
      console.log("⚠️ Leaderboard koleksiyonu boş değil. Üzerine yazma işlemi iptal edildi.");
      process.exit(0);
    }

    console.log("Leaderboard boş. Siber Kadet'ler veritabanına yükleniyor...");

    // 2. Batch (Toplu) İşlem Başlat
    const batch = db.batch();

    seedData.forEach((kadet) => {
      const docRef = leaderboardRef.doc(kadet.id);
      batch.set(docRef, {
        displayName: kadet.displayName,
        high_score: kadet.high_score,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 3. Verileri Gönder
    await batch.commit();
    console.log("✅ Başarılı! 5 adet Siber Kadet sisteme eklendi.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Hata oluştu:", error);
    process.exit(1);
  }
}

seedLeaderboard();
