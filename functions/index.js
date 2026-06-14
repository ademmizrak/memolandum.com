const { onCall, HttpsError } = require("firebase-functions/v2/https");
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

        return { success: true, message: 'İlerleme güvenli şekilde kaydedildi.' };
    } catch (error) {
        console.error("Progress sync error:", error);
        throw new HttpsError('internal', 'Veritabanı güncellenirken hata oluştu.');
    }
});
