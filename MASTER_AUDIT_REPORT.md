# MASTER AUDIT REPORT: Memolandum Güvenlik Denetimi (SAST), Küresel GEO/SEO Mimarisi ve Türkiye Büyüme Atağı (`MASTER_AUDIT_REPORT.md`)

- **Proje:** Memolandum (`https://memolandum.com`) | **Resmi YouTube:** `https://www.youtube.com/@memolandum`
- **Firebase Mülkü:** `memolandum-33dc4`
- **Denetim & Hazırlık Tarihi:** 24 Ekim 2026
- **Operasyonel Kısıtlama (No-Deploy Guardrail):** **AKTİF** — Kesinlikle `firebase deploy` komutu çalıştırılmamıştır; mevcut çalışan kodlar korunarak tüm Bölüm A, Bölüm B ve Bölüm C geliştirmeleri yerel ortamda onaya hazır hale getirilmiştir.

---

## 1. BÖLÜM A: Güvenlik ve Altyapı Denetimi (Non-Destructive SAST Bulguları & Diff Yamaları)

### Görev A1: Firestore ve Cloud Storage Kuralları ([firestore.rules](file:///d:/000Memorade/firestore.rules) & [storage.rules](file:///d:/000Memorade/storage.rules))

1. **Açık Erişim (`allow read, write: if true;`) Kontrolü:**
   - [firestore.rules](file:///d:/000Memorade/firestore.rules) ve [storage.rules](file:///d:/000Memorade/storage.rules) içinde hiçbir koleksiyonda `allow write: if true;` bulunmamaktadır (`storage.rules` satır 15: `allow write: if false;`).
2. **Şema Doğrulaması, Veri Tipi ve Boyut Sınırı (`stats/global`, `vault`, `telemetry`, `leaderboard`, `usernames`):**
   - [firestore.rules](file:///d:/000Memorade/firestore.rules#L9-L42): `users/{userId}/stats/global` üzerinde alan sayısı (`keys().size() <= 24`), `total_xp` (`0..50.000.000`), `total_score` (`0..500.000.000`), `displayName` (`<= 80`) ve `photoURL` protokol doğrulaması (`^https://.*` veya `^/.*`) zorunludur.
   - Ebbinghaus / SM-2 Kelime Kasası (`users/{userId}/vault/{wordId}`) üzerinde `id` (`<= 120`), `english` (`<= 200`) ve `turkish` (`<= 200`) sınırları zorunludur.
3. **Fatura Şişirme (Denial of Wallet) Okuma Limitleri (`request.query.limit`) ve App Check:**
   - [firestore.rules](file:///d:/000Memorade/firestore.rules#L10-L125): `stats/global`, `/{path=**}/stats/{statId}` ve `leaderboard/{userId}` koleksiyonlarında `list` sorguları `request.query.limit != null && request.query.limit <= 50` ile sınırlandırılmıştır (`usernames` için `<= 20`).
   - [src/lib/firebase/config.js](file:///d:/000Memorade/src/lib/firebase/config.js#L35-L49): `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` tanımlandığında otomatik devreye giren `ReCaptchaEnterpriseProvider` (Firebase App Check) ve [functions/googleTranslate.js](file:///d:/000Memorade/functions/googleTranslate.js#L15-L55) içinde kullanıcı başına dakikada **20 istek** hız sınırı (`enforceCloudTranslateRateLimit`) aktiftir.

#### Diff Özeti (`firestore.rules` Denial-of-Wallet & Şema Koruması)
```diff
--- a/firestore.rules
+++ b/firestore.rules
@@ -9,7 +9,8 @@
       // Nested stats collection for Unified Global Progress
       match /stats/global {
-        allow read: if true;
+        allow get: if true;
+        allow list: if request.query.limit != null && request.query.limit <= 50;
         allow create, update: if request.auth != null
           && request.auth.uid == userId
           && request.resource.data.keys().size() <= 24
@@ -88,7 +89,8 @@
     match /usernames/{username} {
-      allow read: if true;
+      allow get: if true;
+      allow list: if request.query.limit != null && request.query.limit <= 20;
@@ -97,7 +99,8 @@
     match /leaderboard/{userId} {
-      allow read: if true;
+      allow get: if true;
+      allow list: if request.query.limit != null && request.query.limit <= 50;
@@ -118,3 +121,4 @@
     match /{path=**}/stats/{statId} {
-      allow read: if statId == 'global';
+      allow get: if statId == 'global';
+      allow list: if statId == 'global' && request.query.limit != null && request.query.limit <= 50;
     }
```

---

### Görev A2: Çok Dilli (23 Dil + RTL) ve Oyun İçi XSS Denetimi
- **URL Parametre Sanitize Kontrolü ([src/app/layout.js](file:///d:/000Memorade/src/app/layout.js#L148-L168), [src/lib/i18n/config.js](file:///d:/000Memorade/src/lib/i18n/config.js#L110-L128)):** `?lang=ar`, `?lang=tr`, `?game=...` parametreleri yalnızca katı beyaz listeyle (`LOCALES = ["tr", "en", "ar", "pt"]` ve `VALID_SLUGS`) doğrulanır; doğrulanmamış hiçbir URL parametresi DOM'a veya `localStorage` içine yazılmaz.
- **`dangerouslySetInnerHTML`, `innerHTML`, `eval()` Taraması:** Kod tabanında `eval()` veya `document.write()` yoktur. [functions/index.js](file:///d:/000Memorade/functions/index.js#L12-L21) SSR fonksiyonunda tüm dinamik alanlar `escapeHtml()` ile encode edilir. [src/app/leaderboard/page.js](file:///d:/000Memorade/src/app/leaderboard/page.js#L194-L205) içinde `photoURL` yalnızca `https://` veya `/` ile başlıyorsa render edilir.
- **Arapça (`dir="rtl"`) ve HTML5 Canvas İzolasyonu ([src/app/games/[slug]/GamePageClient.jsx](file:///d:/000Memorade/src/app/games/%5Bslug%5D/GamePageClient.jsx#L180-L185)):** Oyun kapsayıcısı `dir="ltr" data-game-ltr="true"` ile izole edilmiştir; arayüz sağdan sola (`dir="rtl"`) akarken `Retro Shooter` ve `OrbitLex` Canvas koordinat sistemi bozulmaz.

---

### Görev A3: İstemci Sırları (Secrets) ve HTTP Güvenlik Başlıkları ([firebase.json](file:///d:/000Memorade/firebase.json))
- **İstemci Sırları:** Frontend paketinde gizli API anahtarı sızıntısı yoktur (`GEMINI_API_KEY` ve `SHOPIER_API_SECRET` yalnızca `functions/` ortamında tutulur).
- **HTTP Güvenlik Başlıkları ([firebase.json](file:///d:/000Memorade/firebase.json#L114-L145)):** `Content-Security-Policy` içinde Google Analytics 4 (`googletagmanager.com`, `google-analytics.com`), YouTube (`youtube.com`, `youtube-nocookie.com`, `https://i.ytimg.com`, `https://*.ytimg.com`) ve Firebase servisleri tanımlanmış; `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy` ve `Permissions-Policy` eklenmiştir.

---

## 2. BÖLÜM B: Google Gemini, AI Overviews ve Küresel GEO/SEO Mimarisi

| Görev | Dosya Konumu | Uygulanan Mimari Çözüm |
| :--- | :--- | :--- |
| **Görev B1: `robots.txt` Yapay Zeka Bot İzinleri** | [public/robots.txt](file:///d:/000Memorade/public/robots.txt) | `Googlebot`, `Google-Extended`, `GoogleOther`, `Google-CloudVertexBot`, `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `anthropic-ai`, `Claude-Web`, `PerplexityBot`, `Perplexity-User`, `Applebot-Extended`, `bingbot` için açık `Allow: /` izni + `Sitemap:` ve `LLMs-Txt:` bildirimleri eklendi. |
| **Görev B2: Google Gemini `@graph` JSON-LD Bilgi Grafiği** | [src/lib/seo/jsonLd.js](file:///d:/000Memorade/src/lib/seo/jsonLd.js) & [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js) | `buildKnowledgeGraphJsonLd()` ile `EducationalOrganization` + `Brand` (`sameAs`: `https://www.youtube.com/@memolandum`, Instagram, LinkedIn), `WebApplication` (`EducationalApplication`, `GameApplication`), 23 dil yolu ISO kodları ve 10+ oyun kabuğu (`Retro Shooter`, `OrbitLex` vb.) birleşik `@graph` olarak tanımlandı. |
| **Görev B3: Auto-Locale & Sıfır Tıklamalı Karşılama** | [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js#L148-L185) & [src/lib/i18n/config.js](file:///d:/000Memorade/src/lib/i18n/config.js) | İlk yüklemede URL yolu (`/ar/`, `/pt/`, `/en/`), `?lang=`, `localStorage`, `navigator.languages` ve saat dilimi (`Asia/Baghdad`, `Europe/Istanbul`, `America/Sao_Paulo` vb.) sırasıyla kontrol edilerek sıfır tıklamayla doğru dil ve `dir="rtl"` / `dir="ltr"` yönü uygulanır; ayrıca `/ar/`, `/pt/`, `/en/` statik sayfaları derleme anında (`LocaleProvider initialLocale`) kendi dillerinde ön-derlenir. |

---

## 3. BÖLÜM C: Türkiye Pazarı Atağı (MEB, Akademik Sınavlar, Akıllı Tahta & YouTube Hunisi)

### Görev C1: Türkiye Odaklı `FAQPage` JSON-LD ve `llms.txt` / `llms-full.txt` Kancaları
* **Güncellenen Dosyalar:** [src/lib/seo/siteConfig.js](file:///d:/000Memorade/src/lib/seo/siteConfig.js#L108-L188), [src/lib/seo/jsonLd.js](file:///d:/000Memorade/src/lib/seo/jsonLd.js#L610-L635), [public/llms.txt](file:///d:/000Memorade/public/llms.txt), [public/llms-full.txt](file:///d:/000Memorade/public/llms-full.txt)
* **Entegre Edilen Türkiye Eğitim Kancaları:**
  1. **MEB Müfredatı & Türkiye Yüzyılı Maarif Modeli (1–12. Sınıf):** İlkokul (1., 2., 3., 4. sınıf), Ortaokul (5., 6., 7., 8. sınıf & LGS) ve Lise (9., 10., 11., 12. sınıf YKS-Dil / YDT) ünite kelimeleri ve sesli cümleleriyle tam uyumlu 57 atanabilir hedef.
  2. **Akademik Sınav Hazırlığı (YDS, YÖKDİL, YKS-Dil / YDT, IELTS, TOEFL):** **OrbitLex (`/games/orbitlex/`)** eş/zıt anlamlı (synonym/antonym) uzay platform oyunu ve Kelime & Cümle modüllerinin Ebbinghaus Aralıklı Tekrar (`Memolandum Pulse™` / SM-2) metodolojisiyle akademik sınav kelimeleri için tasarlandığını vurgulayan yapılandırılmış veri blokları.

### Görev C2: Programatik SEO & Doğrudan Oyuna İniş (Deep-Linking) Rota Mimarisi
* **Güncellenen Dosyalar:** [src/app/HomeClient.jsx](file:///d:/000Memorade/src/app/HomeClient.jsx#L246-L322), [src/app/games/[slug]/GamePageClient.jsx](file:///d:/000Memorade/src/app/games/%5Bslug%5D/GamePageClient.jsx#L47-L135), [firebase.json](file:///d:/000Memorade/firebase.json#L183-L295), [src/app/sitemap.js](file:///d:/000Memorade/src/app/sitemap.js)
* **Desteklenen Doğrudan Oyuna İniş (Deep-Link) Formatları:**
  1. **Sorgu Parametreli Deep-Link (`HomeClient.jsx` & `GamePageClient.jsx`):**
     - `https://memolandum.com/?lang=tr&game=retro-shooter&level=grade-5` → Doğrudan 5. Sınıf MEB ünitesiyle `Retro Shooter` başlatır.
     - `https://memolandum.com/?lang=tr&game=orbitlex&level=yds` → Doğrudan YDS/YÖKDİL/IELTS paketiyle `OrbitLex` başlatır.
     - `https://memolandum.com/?lang=tr&game=star-cards&level=grade-2` → Doğrudan 2. Sınıf MEB ünitesiyle `Yıldız Kartlar` başlatır.
     - Desteklenen seviye kısayolları: `grade-1`..`grade-8`, `sinif-1`..`sinif-8`, `lgs`, `yds`, `yokdil`, `ielts`, `toefl`, `yks`, `ydt`.
  2. **Kısa URL Yönlendirmeleri (`firebase.json` 302 Redirects):**
     - `https://memolandum.com/tr/oyna/retro-shooter` & `/oyna/retro-shooter`
     - `https://memolandum.com/tr/oyna/orbitlex` & `/oyna/orbitlex`
     - `https://memolandum.com/tr/oyna/kelime-karti` & `/tr/oyna/yildiz-kartlar`
     - `https://memolandum.com/akilli-tahta` → `/schools/`
     - `https://memolandum.com/ar/play/retro-shooter`, `/pt/play/retro-shooter`, `/en/play/retro-shooter`

### Görev C3: "Akıllı Tahta / Öğretmen Modu" (EBA / ETAP Kaldıracı)
* **Güncellenen Dosyalar:** [src/app/games/[slug]/GamePageClient.jsx](file:///d:/000Memorade/src/app/games/%5Bslug%5D/GamePageClient.jsx#L180-L195), [src/app/schools/page.js](file:///d:/000Memorade/src/app/schools/page.js), [src/lib/seo/siteConfig.js](file:///d:/000Memorade/src/lib/seo/siteConfig.js)
* **Uygulanan Çözüm:**
  - Oyun ekranlarında geniş ekran / akıllı tahta görünümünde (`xl:inline-flex`) 800px Canvas koordinat alanının dışındaki sağ üst köşeye **"🖥️ Akıllı Tahta Tam Ekran"** (Full Screen API — `document.documentElement.requestFullscreen()`) butonu eklendi.
  - `/schools/` ve ana sayfa SEO meta açıklamalarına *"Akıllı tahta uyumlu, üyelik gerektirmeyen sınıf içi İngilizce kelime oyunları (EBA / ETAP)"* vurgusu eklendi.

---

## 4. Onaya Sunulan Üretime Hazır Yapılandırma Dosyaları

### 4.1. Google Gemini Knowledge Graph + Türkiye `FAQPage` Uyumlu JSON-LD
- **Konum:** [src/lib/seo/jsonLd.js](file:///d:/000Memorade/src/lib/seo/jsonLd.js) (`buildKnowledgeGraphJsonLd()` & `buildFaqJsonLd()`) ve [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js)
- `@graph` içinde `EducationalOrganization` + `Brand` (`sameAs`: `https://www.youtube.com/@memolandum`), `WebApplication` (`EducationalApplication`, `GameApplication`), 23 dil ISO kodları, 10+ oyun kabuğu (`Retro Shooter`, `OrbitLex` vb.) ve Türkiye Yüzyılı Maarif Modeli / YDS-IELTS `FAQPage` şeması birleştirilmiştir.

### 4.2. Zenginleştirilmiş `public/llms.txt` ve `public/llms-full.txt`
- **Konum:** [public/llms.txt](file:///d:/000Memorade/public/llms.txt) ve [public/llms-full.txt](file:///d:/000Memorade/public/llms-full.txt)
- Türkiye MEB 1–12. Sınıf (Türkiye Yüzyılı Maarif Modeli), LGS, YKS-Dil (YDT), YDS/YÖKDİL/IELTS/TOEFL `OrbitLex` eş anlamlılar modülü, EBA/ETAP Akıllı Tahta uyumluluğu ve `?lang=tr&game=retro-shooter&level=grade-5` / `/tr/oyna/retro-shooter` derin linkleri eklenmiştir.

### 4.3. Yapay Zeka Bot İzinleri (`public/robots.txt`)
- **Konum:** [public/robots.txt](file:///d:/000Memorade/public/robots.txt)
- `Googlebot`, `Google-Extended`, `GoogleOther`, `Google-CloudVertexBot`, `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `anthropic-ai`, `Claude-Web`, `PerplexityBot`, `Perplexity-User`, `Applebot-Extended`, `bingbot` izinleri + `Sitemap:` ve `LLMs-Txt:` direktifleri hazırdır.

### 4.4. Güvenlik Başlıkları ve Deep-Link Yönlendirmeleri (`firebase.json` & `firestore.rules`)
- **Konum:** [firebase.json](file:///d:/000Memorade/firebase.json) ve [firestore.rules](file:///d:/000Memorade/firestore.rules)
- `firebase.json` içinde GA4, YouTube (`youtube.com`, `ytimg.com`) ve Firebase uyumlu CSP, HSTS, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` başlıkları ve `/tr/oyna/*`, `/akilli-tahta`, `/ar/play/*` yönlendirmeleri; `firestore.rules` içinde şema doğrulaması ve `request.query.limit <= 50` korumaları hazırdır.
