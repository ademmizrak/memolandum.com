# 🛡️ Memolandum (`memolandum.com`) — Küresel Genişleme Sonrası Güvenlik ve Mimari Denetim Raporu (Non-Destructive SAST Audit)

- **Proje Adı:** Memolandum (`https://memolandum.com`)
- **Firebase Mülk Kimliği:** `memolandum-33dc4`
- **Denetim Tarihi:** 24 Ekim 2026
- **Denetim Modu:** Salt-Okunur (Read-Only SAST & Konfigürasyon Denetimi — Canlı sisteme ve kaynak kodlara müdahale edilmemiştir)
- **Kapsam:** Son 48 saatlik 4 Dilli (`TR | EN | AR | PT`) Küresel Genişleme, Arapça RTL (`dir="rtl"`), Bölgesel SEO/GEO Vitrinleri (`/ar/`, `/pt/`, `/en/`), Deep-Linking (`/ar/play` vb.), HTML5 Canvas Oyun Kabukları, Firestore/Cloud Functions Kuralları, HTTP Başlıkları ve NPM Bağımlılıkları.

---

## 1. Yönetici Özeti

### 📊 Genel Güvenlik Skoru: **86 / 100** *(Güçlü Kurumsal Temel — Fatura Koruma ve Şema Sıkılaştırma Önerilir)*

Son 48 saat içinde gerçekleştirilen **otomatik dil algılama (`navigator.languages` + `Intl` saat dilimi), Arapça `dir="rtl"` dönüşümü, bölgesel statik SEO sayfaları (`/ar/`, `/pt/`, `/en/`), `/ar/play` kısayolları, Shopier ödeme bağlantıları ve PWA kurulum çubuğu** geliştirmelerinde **sıfır XSS, sıfır Open Redirect ve sıfır istemci anahtar sızıntısı** tespit edilmiştir.

Bununla birlikte, küresel trafik artışı (Irak, MENA, Brezilya ve küresel reklam/YouTube hunisi) öncesinde **Denial of Wallet (Fatura Şişirme)**, **Liderlik Tablosu Manipülasyonu** ve **Capacitor Mobil WebView** risklerini tamamen kapatmak için aşağıdaki bulgular raporlanmıştır:

| Kritiklik Seviyesi | Adet | Özet Dağılım |
| :--- | :---: | :--- |
| 🔴 **Kritik (Critical)** | **1** | Capacitor Android/iOS (`<8.4.3`) yerel HTTP proxy zafiyeti (`GHSA-rvm3-566m-v7fv` — yalnızca mobil uygulama derlemesini etkiler, web'i etkilemez) |
| 🟠 **Yüksek (High)** | **2** | 1) `users/{uid}/stats/global` ve `leaderboard/{uid}` üzerinde şema/tavan doğrulaması eksikliği <br> 2) `cloudTranslate` fonksiyonunda karakter/kota sınırı olmaması ve `App Check` pasifliği (Denial of Wallet riski) |
| 🟡 **Orta (Moderate)** | **3** | 1) `firebase.json` içinde `Content-Security-Policy (CSP)` başlığının bulunmaması <br> 2) `firestore.rules` içinde `/{path=**}/stats/{statId}` wildcard okuma izni <br> 3) Eski `functions/index.js` (`exports.ssr`) içinde HTML escape yardımcı fonksiyonu eksikliği |
| 🔵 **Düşük (Low)** | **2** | 1) `src/app/leaderboard/page.js` içinde `photoURL` protokol (`https://`) doğrulaması <br> 2) `users/{uid}/telemetry` koleksiyonunda alan sayısı sınırı eksikliği |

---

## 2. Görev Bazlı Detaylı Bulgular ve Çözüm Kodları (Patch Diff)

### Görev 1: Firestore ve Cloud Storage Güvenlik Kuralları Denetimi

#### 🟠 Bulgu 1.1 (Yüksek): `users/{userId}/stats/global` ve `leaderboard/{userId}` Şema / Değer Tavanı Eksikliği
- **Konum:** [firestore.rules](file:///d:/000Memorade/firestore.rules#L9-L12) ve [firestore.rules](file:///d:/000Memorade/firestore.rules#L83-L90)
- **Risk Açıklaması:**
  - `users/{userId}/stats/global` herkes tarafından okunabilir (`allow read: if true;`) çünkü `/leaderboard` sayfası ([src/app/leaderboard/page.js](file:///d:/000Memorade/src/app/leaderboard/page.js#L63-L67)) `collectionGroup(db, "stats")` sorgusuyla en yüksek `total_xp` değerlerini buradan çeker.
  - Ancak `allow write: if request.auth != null && request.auth.uid == userId;` kuralında **veri tipi, karakter boyutu veya maksimum puan artışı kontrolü yoktur**.
  - Kötü niyetli bir kullanıcı tarayıcı konsolundan kendi `users/{uid}/stats/global` belgesine `total_xp: 999999999999`, 500 KB boyutunda çöp veri veya `photoURL: "javascript:..."` yazarak küresel liderlik tablosunu manipüle edebilir.
- **Çözüm Kodu (Diff):**
```diff
--- a/firestore.rules
+++ b/firestore.rules
@@ -8,10 +8,21 @@
       // Nested stats collection for Unified Global Progress
       match /stats/global {
         allow read: if true; // Public read for Leaderboard Collection Group queries
-        allow write: if request.auth != null && request.auth.uid == userId;
+        allow create, update: if request.auth != null
+          && request.auth.uid == userId
+          && request.resource.data.keys().size() <= 20
+          && (!('total_xp' in request.resource.data) || (request.resource.data.total_xp is int && request.resource.data.total_xp >= 0 && request.resource.data.total_xp <= 5000000))
+          && (!('total_score' in request.resource.data) || (request.resource.data.total_score is int && request.resource.data.total_score >= 0 && request.resource.data.total_score <= 50000000))
+          && (!('displayName' in request.resource.data) || (request.resource.data.displayName is string && request.resource.data.displayName.size() <= 60))
+          && (!('photoURL' in request.resource.data) || request.resource.data.photoURL == null || (request.resource.data.photoURL is string && request.resource.data.photoURL.size() <= 500 && request.resource.data.photoURL.matches('^https://.*')));
+        allow delete: if request.auth != null && request.auth.uid == userId;
       }
```

#### 🟡 Bulgu 1.2 (Orta): `match /{path=**}/stats/{statId}` Wildcard Collection Group Okuma İzni
- **Konum:** [firestore.rules](file:///d:/000Memorade/firestore.rules#L98-L100)
- **Risk Açıklaması:** `match /{path=**}/stats/{statId} { allow read: if true; }` kuralı, veritabanının herhangi bir yerindeki `stats` adlı alt koleksiyonların tamamını (`statId` ne olursa olsun) herkese açar. Uygulama yalnızca `statId == 'global'` belgesini liderlik tablosu için kullanmaktadır.
- **Çözüm Kodu (Diff):**
```diff
--- a/firestore.rules
+++ b/firestore.rules
@@ -97,4 +97,4 @@
     // Explicitly allow collection group query for 'stats'
     match /{path=**}/stats/{statId} {
-      allow read: if true;
+      allow read: if statId == 'global';
     }
```

#### 🔵 Bulgu 1.3 (Düşük): `telemetry/{logId}` Üzerinde Boyut Sınırı Eksikliği (Storage Abuse Koruması)
- **Konum:** [firestore.rules](file:///d:/000Memorade/firestore.rules#L28-L32)
- **Risk Açıklaması:** `telemetry/{logId}` yalnızca eklenebilir (`allow update, delete: if false;`) olarak doğru tasarlanmıştır; ancak `create` sırasında alan sayısı sınırı (`keys().size() <= 25`) bulunmamaktadır.
- **Çözüm Kodu (Diff):**
```diff
--- a/firestore.rules
+++ b/firestore.rules
@@ -28,5 +28,7 @@
       match /telemetry/{logId} {
         allow read: if request.auth != null && request.auth.uid == userId;
-        allow create: if request.auth != null && request.auth.uid == userId;
+        allow create: if request.auth != null
+          && request.auth.uid == userId
+          && request.resource.data.keys().size() <= 25;
         allow update, delete: if false; // telemetry logs are append-only/immutable
       }
```

---

### Görev 2: Çok Dilli (23 Dil + Arapça RTL) ve Routing XSS Denetimi

#### ✅ Son 48 Saatlik Çok Dilli & RTL Geliştirmelerinin Analizi (Temiz)
1. **Otomatik Dil & Saat Dilimi Algılama ([src/app/layout.js](file:///d:/000Memorade/src/app/layout.js#L156-L193) & [src/lib/i18n/config.js](file:///d:/000Memorade/src/lib/i18n/config.js#L110-L142)):**
   - URL'den okunan `?lang=` parametresi ve `localStorage.getItem('memolandum-ui-locale')` değeri yalnızca `var supported = { tr: 1, en: 1, ar: 1, pt: 1 }` beyaz listesinden geçerse `document.documentElement.lang` ve `dir` özniteliklerine atanır.
   - `/?lang="><script>alert(1)</script>` gibi tüm saldırı yükleri `supported[q]` kontrolünde elenir.
2. **HTML5 Canvas Oyun Motorları ([src/app/games/[slug]/GamePageClient.jsx](file:///d:/000Memorade/src/app/games/%5Bslug%5D/GamePageClient.jsx#L70-L142)):**
   - `slug` değeri sabit `VALID_SLUGS` dizisiyle kontrol edilir; geçersiz değerler `/` adresine yönlendirilir.
   - Canvas içinde kelime ve oyuncu adları `ctx.fillText()` ile çizildiğinden DOM XSS oluşamaz.

#### 🟡 Bulgu 2.1 (Orta): Eski `functions/index.js` (`exports.ssr`) İçinde HTML Escape Eksikliği
- **Konum:** [functions/index.js](file:///d:/000Memorade/functions/index.js#L300-L330)
- **Risk Açıklaması:** Botlar için çalışan eski `exports.ssr` fonksiyonunda `slug` değeri manifest eşleşmesinden (`[a-z0-9-]+`) geçtiği için doğrudan dış enjeksiyona kapalıdır; ancak JSON veri dosyalarından okunan `${original}` ve `${translation}` metinleri `<td>` içine doğrudan yerleştirilmektedir. Veri tabanında `<` veya `"` karakteri geçen bir kelime olması durumunda HTML yapısını bozabilir.
- **Çözüm Kodu (Diff):**
```diff
--- a/functions/index.js
+++ b/functions/index.js
@@ -299,14 +299,22 @@
+  const escapeHtml = (str) =>
+    String(str || "")
+      .replace(/&/g, "&amp;")
+      .replace(/</g, "&lt;")
+      .replace(/>/g, "&gt;")
+      .replace(/"/g, "&quot;")
+      .replace(/'/g, "&#39;");
+
   let tableRows = "";
   rawWords.forEach((w, index) => {
     const original = w.word || w.original_script || w.english || w.en || w.osmanlica_latin || w.hanzi || w.kanji || w.character || w.character_script || w.root || "";
     const translation = w.translation || w.meaning || w.turkish || w.tr || w.guncel_turkce || 
                         w.es || w.fr || w.de || w.ar || w.pt || w.brpt || w.zh || w.cn || w.it || w.ru || w.ja || w.jap || w.ko || w.el || w.type || "";
     tableRows += `
       <tr>
         <td>${index + 1}</td>
-        <td><strong>${original}</strong></td>
-        <td>${translation}</td>
-        <td>${w.pos || "N/A"}</td>
+        <td><strong>${escapeHtml(original)}</strong></td>
+        <td>${escapeHtml(translation)}</td>
+        <td>${escapeHtml(w.pos || "N/A")}</td>
       </tr>`;
   });
```

#### 🔵 Bulgu 2.2 (Düşük): Liderlik Tablosunda `user.photoURL` Protokol Kontrolü
- **Konum:** [src/app/leaderboard/page.js](file:///d:/000Memorade/src/app/leaderboard/page.js#L186-L191)
- **Risk Açıklaması:** `user.photoURL` doğrudan `<img src={user.photoURL} />` olarak basılmaktadır. Yalnızca `https://` ile başlayan URL'lerin kabul edilmesi güvenli resim yükleme standardıdır.
- **Çözüm Kodu (Diff):**
```diff
--- a/src/app/leaderboard/page.js
+++ b/src/app/leaderboard/page.js
@@ -186,3 +186,3 @@
-                      {user.photoURL ? (
+                      {typeof user.photoURL === "string" && user.photoURL.startsWith("https://") ? (
                         <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" className={`w-12 h-12 rounded-full border-2 ${
```

---

### Görev 3: İstemci Tarafı Sırların (Secrets), `.gitignore` ve Firebase App Check Denetimi

#### ✅ İstemci Paketi (Frontend Bundle) & `.gitignore` Durumu
- `src/` altında yalnızca genel Firebase Web SDK anahtarları (`NEXT_PUBLIC_FIREBASE_*`) kullanılmaktadır.
- `GEMINI_API_KEY`, `SHOPIER_PAT` ve `SHOPIER_WEBHOOK_TOKEN` istemci kodunda **kesinlikle yer almamakta**, yalnızca `functions/` altında `defineSecret` ile çağrılmaktadır.
- `.gitignore` dosyası `.env*`, `*.pem`, `serviceAccountKey.json`, `shopier.txt` ve `scratch/` dizinini dışlamaktadır.

#### 🟠 Bulgu 3.1 (Yüksek — Denial of Wallet Riski): `cloudTranslate` Karakter/Hız Sınırı Eksikliği ve `App Check` Pasifliği
- **Konum:** [functions/googleTranslate.js](file:///d:/000Memorade/functions/googleTranslate.js#L41-L71) ve [src/lib/firebase/config.js](file:///d:/000Memorade/src/lib/firebase/config.js#L36-L77)
- **Risk Açıklaması:**
  1. [functions/translate.js](file:///d:/000Memorade/functions/translate.js#L137) içindeki `geminiTranslate` fonksiyonunda `text.length > 4000` sınırı varken, [functions/googleTranslate.js](file:///d:/000Memorade/functions/googleTranslate.js#L41-L71) içindeki `cloudTranslate` fonksiyonunda **metin uzunluğu sınırı (`text.length`), dizi boyutu sınırı veya dakika başı istek sınırı (rate-limit) bulunmamaktadır**. Giriş yapmış bir kullanıcı tek seferde yüz binlerce karakterlik bir dizi göndererek Google Cloud Translation API v3 faturasını şişirebilir.
  2. [src/lib/firebase/config.js](file:///d:/000Memorade/src/lib/firebase/config.js#L36) içinde `appCheck = null` olarak bırakılmış; `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` tanımlandığında otomatik devreye girecek şekilde bağlanmalıdır.
- **Çözüm Kodu (`functions/googleTranslate.js` Diff):**
```diff
--- a/functions/googleTranslate.js
+++ b/functions/googleTranslate.js
@@ -38,16 +38,38 @@
+const translateRateMap = new Map();
+function enforceCloudTranslateRateLimit(uid, maxPerMinute = 20) {
+  const now = Date.now();
+  const entry = translateRateMap.get(uid) || { count: 0, resetAt: now + 60000 };
+  if (now > entry.resetAt) {
+    entry.count = 0;
+    entry.resetAt = now + 60000;
+  }
+  entry.count += 1;
+  translateRateMap.set(uid, entry);
+  if (entry.count > maxPerMinute) {
+    throw new HttpsError("resource-exhausted", "Çok sık çeviri isteği gönderildi. Lütfen 1 dakika bekleyin.");
+  }
+}
+
 /**
  * Firebase Cloud Function Endpoint: cloudTranslate
  */
 exports.cloudTranslate = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
   if (!request.auth) {
     throw new HttpsError("unauthenticated", "Çeviri yapmak için giriş yapmalısınız.");
   }
+  enforceCloudTranslateRateLimit(request.auth.uid, 20);
+
   const data = request.data || {};
   const text = data.text;
   const targetLanguage = String(data.targetLanguage || "tr").slice(0, 10);
   const sourceLanguage = data.sourceLanguage ? String(data.sourceLanguage).slice(0, 10) : null;
 
-  if (!text) {
+  if (!text || (typeof text !== "string" && !Array.isArray(text))) {
     throw new HttpsError("invalid-argument", "Çevrilecek metin belirtilmedi.");
   }
+  const items = Array.isArray(text) ? text : [text];
+  if (items.length > 10 || items.some((t) => typeof t !== "string" || t.length > 2000)) {
+    throw new HttpsError("invalid-argument", "Metin boyutu sınırları aşıldı (azami 10 öğe, 2000 karakter).");
+  }
```

- **Çözüm Kodu (`src/lib/firebase/config.js` — Opsiyonel App Check Başlatma Diff):**
```diff
--- a/src/lib/firebase/config.js
+++ b/src/lib/firebase/config.js
@@ -10,6 +10,7 @@
 import { getFunctions, httpsCallable } from "firebase/functions";
 import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
+import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
 
@@ -63,6 +64,16 @@
     if (typeof window !== "undefined") {
+      const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
+      if (recaptchaKey) {
+        try {
+          appCheck = initializeAppCheck(app, {
+            provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
+            isTokenAutoRefreshEnabled: true,
+          });
+        } catch (e) {
+          console.warn("AppCheck init warning:", e?.message || e);
+        }
+      }
       isAnalyticsSupported()
```

---

### Görev 4: HTTP Güvenlik Başlıkları ve Hosting Yapılandırması

- **Mevcut Durum:** `https://memolandum.com` üzerinde `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` ve `Permissions-Policy` başlıkları **aktif ve çalışır durumdadır**.
- **🟡 Bulgu 4.1 (Orta): `Content-Security-Policy (CSP)` Başlığı Eksikliği:**
  - Next.js statik export, Google Analytics 4, Google Fonts (`Cairo`), Firebase Auth/Firestore/Storage/Functions ve YouTube Shorts (`www.youtube.com`) iframe'lerini kırmadan koruma sağlayan `Content-Security-Policy` başlığı aşağıdaki Bölüm 3.1'de hazır şablon olarak sunulmuştur.

---

### Görev 5: Bağımlılık (Dependency) Güvenliği (`npm audit --audit-level=high`)

`npm audit --audit-level=high` (salt-okunur) tarama özeti:

| Paket | Mevcut Sürüm / Aralık | Kritiklik | CVE / GHSA | Memolandum Üzerindeki Gerçek Etkisi ve Çözüm Önerisi |
| :--- | :--- | :---: | :--- | :--- |
| `@capacitor/android` & `@capacitor/ios` | `>=8.3.5 <8.4.3` | 🔴 **Kritik** | `GHSA-rvm3-566m-v7fv` | **Web sitesini etkilemez.** Mobil (Android/iOS) paketlemede yerel HTTP proxy üzerinden uzak içerik yüklenmesini önlemek için `npm install @capacitor/android@latest @capacitor/ios@latest` ile `8.4.3+` sürümüne güncellenmelidir. |
| `zod` | `<4.6.6` | 🟠 **Yüksek** | `GHSA-mrhx-c7xc-m3w5` | Büyük koleksiyon doğrulamalarında bellek tüketimi. `npm audit fix` ile kırılmasız güncellenebilir. |
| `@xmldom/xmldom` | `0.9.0-beta.1 - 0.9.11` | 🟠 **Yüksek** | `GHSA-6gmq-8vp8-gcm6` | Yalnızca Capacitor CLI araç zincirinde (build-time) kullanılır; üretim (production) web paketinde yer almaz. `npm audit fix` ile güncellenebilir. |
| `next` | `16.2.9` | 🟠 **Yüksek** | `GHSA-2xp9-vwfh-vxw4` vb. | Bildirilen zafiyetler Next.js'in sunucu çalışma zamanı (`next start` Image Optimization API ve Server Actions) içindir. Memolandum `output: "export"` (tamamen statik HTML) olarak Firebase Hosting CDN üzerinden sunulduğu için **canlı ortamda bu RCE/SSRF uç noktaları mevcut değildir (istismar edilemez)**. |

---

## 3. Doğrudan Uygulanabilir Sıkılaştırılmış Şablonlar

### 3.1. Sıkılaştırılmış `firestore.rules` Şablonu (Tam Dosya)

Mevcut çalışan sınıf (`classrooms`), kelime kasası (`vault`), abonelik (`billing`) ve liderlik tablosu akışlarını **hiç bozmadan** Bulgu 1.1, 1.2 ve 1.3'ü kapatan tam `firestore.rules` şablonu:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Nested stats collection for Unified Global Progress
      match /stats/global {
        allow read: if true; // Public read for Leaderboard Collection Group queries
        allow create, update: if request.auth != null
          && request.auth.uid == userId
          && request.resource.data.keys().size() <= 20
          && (!('total_xp' in request.resource.data) || (request.resource.data.total_xp is int && request.resource.data.total_xp >= 0 && request.resource.data.total_xp <= 5000000))
          && (!('total_score' in request.resource.data) || (request.resource.data.total_score is int && request.resource.data.total_score >= 0 && request.resource.data.total_score <= 50000000))
          && (!('displayName' in request.resource.data) || (request.resource.data.displayName is string && request.resource.data.displayName.size() <= 60))
          && (!('photoURL' in request.resource.data) || request.resource.data.photoURL == null || (request.resource.data.photoURL is string && request.resource.data.photoURL.size() <= 500 && request.resource.data.photoURL.matches('^https://.*')));
        allow delete: if request.auth != null && request.auth.uid == userId;
      }

      // Kelime Kasası — yalnızca hesabın sahibi; boyutu sınırlı tut
      match /vault/{wordId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create, update: if request.auth != null
          && request.auth.uid == userId
          && request.resource.data.keys().hasAll(['id'])
          && request.resource.data.id is string
          && request.resource.data.id.size() <= 120
          && (!('english' in request.resource.data) || (request.resource.data.english is string && request.resource.data.english.size() <= 200))
          && (!('turkish' in request.resource.data) || (request.resource.data.turkish is string && request.resource.data.turkish.size() <= 200));
        allow delete: if request.auth != null && request.auth.uid == userId;
      }

      // Telemetry Logs — 3.0 AI-Ready (Google for Startups data flywheel)
      match /telemetry/{logId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null
          && request.auth.uid == userId
          && request.resource.data.keys().size() <= 25;
        allow update, delete: if false; // telemetry logs are append-only/immutable
      }

      // Dil bazlı öğrenme profilleri
      match /studyProfiles/{profileId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /profileStats/{profileId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      // Güvenlik / hesap meta (şifre olayları, sync işaretleri)
      match /meta/{docId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create, update: if request.auth != null
          && request.auth.uid == userId
          && request.resource.data.keys().size() <= 24
          && (!('recentEvents' in request.resource.data)
            || (request.resource.data.recentEvents is list
                && request.resource.data.recentEvents.size() <= 20));
        allow delete: if request.auth != null && request.auth.uid == userId;
      }

      // Premium abonelik — yalnızca Cloud Functions (Admin SDK)
      match /billing/subscription {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false;
      }
      // AI çeviri kotası — istemci yalnızca +1 artırabilir (localStorage bypass engeli)
      match /billing/usage {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null
          && request.auth.uid == userId
          && request.resource.data.keys().hasAll(['translationCount'])
          && request.resource.data.translationCount is int
          && request.resource.data.translationCount == 1;
        allow update: if request.auth != null
          && request.auth.uid == userId
          && request.resource.data.translationCount is int
          && resource.data.translationCount is int
          && request.resource.data.translationCount == resource.data.translationCount + 1;
        allow delete: if false;
      }
      match /billing/{docId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false;
      }
    }
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null
        && username.size() >= 3
        && username.size() <= 30
        && request.resource.data.uid == request.auth.uid
        && !exists(/databases/$(database)/documents/usernames/$(username));
      allow delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    match /leaderboard/{userId} {
      allow read: if true;
      allow update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.high_score is int
        && request.resource.data.high_score >= resource.data.high_score
        && request.resource.data.high_score <= 50000000;
      allow create: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.high_score is int
        && request.resource.data.high_score >= 0
        && request.resource.data.high_score <= 50000000;
      // Hesap silme (Privacy / Play Store) — yalnızca kendi kaydı
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Ödeme oturumları — yalnızca Admin SDK (istemci okuyamaz/yazamaz)
    match /premiumCheckouts/{checkoutId} {
      allow read, write: if false;
    }

    // Explicitly allow collection group query for 'stats/global'
    match /{path=**}/stats/{statId} {
      allow read: if statId == 'global';
    }

    // Memolandum for Schools — classrooms/{classCode}
    match /classrooms/{classCode} {
      function isSignedIn() {
        return request.auth != null;
      }
      function isTeacher() {
        return isSignedIn() && resource.data.teacherUid == request.auth.uid;
      }
      function isTeacherCreate() {
        return isSignedIn() && request.resource.data.teacherUid == request.auth.uid;
      }
      function teacherUidUnchanged() {
        return request.resource.data.teacherUid == resource.data.teacherUid;
      }
      function immutableClassMeta() {
        return request.resource.data.classCode == resource.data.classCode
          && (!('createdAt' in resource.data) || request.resource.data.createdAt == resource.data.createdAt);
      }

      allow get: if isTeacher();
      allow list: if isSignedIn() && resource.data.teacherUid == request.auth.uid;

      allow create: if isTeacherCreate()
        && request.resource.data.keys().hasAll([
          'classCode', 'teacherUid', 'className', 'grade', 'students', 'studentsCount'
        ])
        && request.resource.data.classCode is string
        && request.resource.data.classCode.size() >= 3
        && request.resource.data.classCode.size() <= 20
        && request.resource.data.teacherName is string
        && request.resource.data.teacherName.size() <= 100
        && request.resource.data.schoolName is string
        && request.resource.data.schoolName.size() <= 140
        && request.resource.data.studentsCount == 0
        && request.resource.data.students.keys().size() == 0
        && (
          !('memberIds' in request.resource.data)
          || (
            request.resource.data.memberIds is list
            && request.resource.data.memberIds.size() == 0
          )
        );

      allow update: if isTeacher() && teacherUidUnchanged() && immutableClassMeta();
      allow delete: if isTeacher();

      match /teacherNotes/{studentId} {
        function ownsClassroom() {
          return request.auth != null
            && get(/databases/$(database)/documents/classrooms/$(classCode)).data.teacherUid
              == request.auth.uid;
        }
        allow read: if ownsClassroom();
        allow create, update: if ownsClassroom()
          && request.resource.data.keys().hasAll(['text', 'teacherUid', 'studentId'])
          && request.resource.data.teacherUid == request.auth.uid
          && request.resource.data.studentId == studentId
          && request.resource.data.text is string
          && request.resource.data.text.size() <= 5000;
        allow delete: if ownsClassroom();
      }
    }

    match /b2bLeads/{leadId} {
      allow create: if request.resource.data.keys().hasAll(['schoolName', 'contactName'])
        && request.resource.data.keys().size() <= 12
        && request.resource.data.schoolName is string
        && request.resource.data.schoolName.size() <= 160
        && request.resource.data.contactName is string
        && request.resource.data.contactName.size() <= 120;
      allow read, update, delete: if false;
    }

    match /parentFeedback/{ticketId} {
      allow read, write: if false;
    }

    match /admins/{adminUid} {
      allow read: if request.auth != null && request.auth.uid == adminUid;
      allow write: if false;
    }
  }
}
```

### 3.2. `firebase.json` İçin Uyumlu `Content-Security-Policy (CSP)` ve Güvenlik Başlıkları Şablonu

`firebase.json` içerisindeki `"source": "**"` bloğuna eklenecek, Google Analytics 4, YouTube Shorts, Google Fonts (`Cairo`), Firebase Auth/Firestore/Storage ve ses dosyalarıyla (`blob:`, `data:`) %100 uyumlu başlık yapılandırması:

```json
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), geolocation=(), payment=(self)"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https://storage.googleapis.com https://*.firebasestorage.app; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.cloudfunctions.net https://*.run.app https://www.google-analytics.com https://region1.google-analytics.com https://storage.googleapis.com https://*.firebasestorage.app wss://*.firebaseio.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.firebaseapp.com https://accounts.google.com https://www.google.com; object-src 'none'; base-uri 'self';"
          }
        ]
      }
```
