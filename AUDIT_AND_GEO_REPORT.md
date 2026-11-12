# Memolandum Küresel Güvenlik Denetimi (SAST) ve Çoklu-Model GEO/SEO Mükemmeliyet Raporu (`AUDIT_AND_GEO_REPORT.md`)

- **Proje:** Memolandum (`https://memolandum.com`)
- **Firebase Mülk Kimliği:** `memolandum-33dc4`
- **Denetim Tarihi:** 24 Ekim 2026
- **Operasyonel Mod:** **No-Deploy Guardrail Aktif** (`firebase deploy` çalıştırılmamıştır; tüm raporlama ve yerel kod/yapılandırma hazırlıkları canlı sistemi etkilemeden tamamlanmıştır).

---

## 1. Yönetici Özeti (Executive Summary)

Son 48 saat içinde yapılan **23 dil yolu**, **Arapça RTL (`dir="rtl"`)**, **Brezilya Portekizcesi (`pt-BR`)** ve **10+ arcade oyun kabuğu** (`Retro Shooter`, `OrbitLex`, `Star Trio Cards`, `Wooden Word Board`, `Word Card` vb.) geliştirmeleri sonucunda Memolandum; `chatgpt.com` üzerinden organik GEO trafiği ve Irak/MENA bölgesi başta olmak üzere küresel kullanıcı akışı yakalamıştır.

Bu denetim iki temel hedefi gerçekleştirmiştir:
1. **Bölüm A (Non-Destructive SAST Güvenlik Denetimi):** Firestore/Storage kuralları, XSS yüzeyleri, istemci sırları ve HTTP güvenlik başlıkları taranmış; Fatura Şişirme (`Denial of Wallet`) saldırılarına karşı `request.query.limit <= 50` (ve `usernames` için `<= 20`) sorgu limitleri dahil tüm sıkılaştırmalar hazırlanmıştır.
2. **Bölüm B (Google Gemini, AI Overviews, Claude & Perplexity GEO/SEO Mimarisi):** `chatgpt.com` platformu önerirken **Google Gemini (Google Grounding / Knowledge Graph)** ve **Google AI Overviews** motorlarının neden daha az indeksleme yaptığının **kod üzerindeki 5 somut kanıtı** tespit edilmiş ve tamamı yerel kod tabanında giderilmiştir.

---

## 2. BÖLÜM A: Güvenlik ve Altyapı Denetimi (SAST Bulguları ve Durum)

### Görev A1: Firestore ve Cloud Storage Kuralları ([firestore.rules](file:///d:/000Memorade/firestore.rules) & [storage.rules](file:///d:/000Memorade/storage.rules))

| Kontrol Noktası | Durum | Teknik Kanıt ve Uygulanan Sıkılaştırma |
| :--- | :--- | :--- |
| Açık erişim (`allow read, write: if true;`) | **GÜVENLİ (Yok)** | Hiçbir koleksiyonda `allow write: if true;` bulunmamaktadır. `storage.rules` tüm dosya yollarında `allow write: if false;` ile kilitlidir. |
| Oyun skorları ve Ebbinghaus tekrar verilerinde Şema & Boyut Doğrulaması | **SIKILAŞTIRILDI** | `users/{userId}/stats/global` üzerinde alan sayısı (`<= 24`), `total_xp` (`0..50.000.000`), `total_score` (`0..500.000.000`), `displayName` (`<= 80`) ve `photoURL` (`^https://.*` veya `^/.*`) doğrulaması aktiftir. `vault/{wordId}` (Ebbinghaus / SM-2 Kelime Kasası) üzerinde `id` (`<= 120`), `english` (`<= 200`) ve `turkish` (`<= 200`) sınırları zorunludur. |
| Okul & Sınıf Masası (`classrooms/{classCode}`) IDOR ve Skor Koruması | **GÜVENLİ** | Öğrenci katılımı ve skor yazımı yalnızca Cloud Functions (`Admin SDK`) üzerinden yapılır; istemciden doğrudan öğrenci skoru yazılamaz. Öğretmen notları (`teacherNotes`) yalnızca sınıf sahibi öğretmene (`ownsClassroom()`) açıktır. |
| **Fatura Şişirme (Denial of Wallet) Okuma Limitleri (`request.query.limit`)** | **GÜÇLENDİRİLDİ** | `stats/global`, `/{path=**}/stats/{statId}` ve `leaderboard/{userId}` koleksiyonlarında `allow read: if true;` kuralı `allow get: if true;` ve `allow list: if request.query.limit != null && request.query.limit <= 50;` olarak ayrıştırıldı (`leaderboard/page.js` `limit(25)` kullandığı için mevcut kod %100 uyumludur). `usernames/{username}` için `allow list: if request.query.limit != null && request.query.limit <= 20;` eklendi. |
| **Firebase App Check (`ReCaptchaEnterpriseProvider`)** | **HAZIR** | [src/lib/firebase/config.js](file:///d:/000Memorade/src/lib/firebase/config.js) içinde `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` tanımlandığında otomatik devreye giren `initializeAppCheck` + [functions/googleTranslate.js](file:///d:/000Memorade/functions/googleTranslate.js) içinde kullanıcı başına dakikada **20 istek** hız sınırı (`enforceCloudTranslateRateLimit`) mevcuttur. |

### Görev A2: Çok Dilli (23 Dil + Arapça RTL) ve Oyun İçi XSS Denetimi

| Kontrol Noktası | Durum | Teknik Kanıt |
| :--- | :--- | :--- |
| URL Parametreleri (`?lang=ar`, `?game=...`, UTM) Sanitize Edilmesi | **GÜVENLİ** | [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js#L148-L168) ve [src/lib/i18n/config.js](file:///d:/000Memorade/src/lib/i18n/config.js#L110-L124) içinde `?lang=` parametresi sıkı beyaz listeyle (`supported = { tr: 1, en: 1, ar: 1, pt: 1 }`) kontrol edilir; rastgele metinler DOM'a veya `localStorage` içine asla yazılmaz. |
| `dangerouslySetInnerHTML`, `innerHTML`, `eval()` Taraması | **GÜVENLİ** | Kod tabanında `eval()` veya `document.write()` yoktur. `dangerouslySetInnerHTML` yalnızca statik JSON-LD bloklarında (`JSON.stringify`) ve statik tema/dil başlatıcısında kullanılır. [functions/index.js](file:///d:/000Memorade/functions/index.js) SSR fonksiyonunda tüm dinamik alanlar `escapeHtml()` ile encode edilmektedir. |
| Arapça (`dir="rtl"`) ve HTML5 Canvas Koordinat İzolasyonu | **GÜVENLİ** | `Retro Shooter`, `OrbitLex` ve diğer tüm HTML5 Canvas oyun motorlarında çizim metinleri `ctx.fillText()` API'si ile basılır (DOM/XSS oluşturmaz) ve oyun kapsayıcıları `dir="ltr"` olarak izole edildiği için RTL geçişlerinde Canvas koordinat sistemi bozulmaz. |

### Görev A3: İstemci Sırları (Secrets) ve HTTP Güvenlik Başlıkları ([firebase.json](file:///d:/000Memorade/firebase.json))
- **İstemci Sırları:** `NEXT_PUBLIC_` önekli değişkenler yalnızca genel Firebase Web SDK yapılandırmasını içerir. Özel anahtarlar (`GEMINI_API_KEY`, `SHOPIER_API_SECRET`) yalnızca sunucu tarafında (`functions/`) tutulmaktadır ve `.gitignore` (`shopier.txt`, `.env*`, `scratch/`) ile korunmaktadır.
- **HTTP Güvenlik Başlıkları:** [firebase.json](file:///d:/000Memorade/firebase.json) içinde Google Analytics 4 (`googletagmanager.com`, `google-analytics.com`), YouTube (`youtube.com`, `youtube-nocookie.com`) ve Firebase servisleriyle tam uyumlu **CSP (`Content-Security-Policy`)**, **HSTS (`Strict-Transport-Security`)**, **`X-Frame-Options: SAMEORIGIN`**, **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy`** ve **`Permissions-Policy`** başlıkları yapılandırılmıştır.

---

## 3. BÖLÜM B: Google Gemini, AI Overviews, Claude & Perplexity GEO/SEO Analizi

### Neden `chatgpt.com` Önerirken Google Gemini Daha Az İndeksliyordu? (Kod Üzerindeki 5 Kanıt ve Uygulanan Çözüm)

#### Kanıt 1: Google Knowledge Graph & Gemini Grounding İçin `sameAs` (Entity Linking) ve `@graph` Eksikliği
* **Tespit ([src/lib/seo/jsonLd.js](file:///d:/000Memorade/src/lib/seo/jsonLd.js)):**
  - `buildOrganizationJsonLd()` içinde `@type` yalnızca `"Organization"` olarak tanımlıydı (`EducationalOrganization` ve `Brand` tipleri eksikti).
  - Kritik **`sameAs`** dizisinde yalnızca GitHub linki vardı; platforma aktif organik trafik getiren resmi YouTube kanalı (`https://www.youtube.com/@memolandum`), Instagram ve LinkedIn varlıkları `sameAs` içinde yer almıyordu. Google Gemini, bir markanın web sitesini YouTube ekosistemiyle eşleştirirken (Entity Reconciliation) `sameAs` dizisini birincil sinyal olarak kullanır.
  - Ayrıca son eklenen **OrbitLex (`/games/orbitlex/`)**, **Star Trio Cards (`/games/star-cards/`)** ve **Wooden Word Board (`/games/word-board/`)** oyun kabukları JSON-LD şemalarında (`VideoGame` / `ItemList`) yer almıyordu.
* **Çözüm:** [src/lib/seo/jsonLd.js](file:///d:/000Memorade/src/lib/seo/jsonLd.js) içinde birleşik `@graph` (`buildKnowledgeGraphJsonLd()`) mimarisi kuruldu; `EducationalOrganization` + `Brand` tipleri, `@memolandum` YouTube kanalı `sameAs` bağlantısı, 23 dil yolunun ISO kodları ve tüm 10+ arcade oyun kabuğu (`VideoGame` & `LearningResource`) eklendi.

#### Kanıt 2: `/ar/`, `/pt/` ve `/en/` Statik Sayfalarında SSR Dil Uyumsuzluğu ve `hidden aria-hidden="true"` Sorunu
* **Tespit ([src/lib/i18n/LocaleProvider.jsx](file:///d:/000Memorade/src/lib/i18n/LocaleProvider.jsx) & [src/app/ar/page.js](file:///d:/000Memorade/src/app/ar/page.js)):**
  - `LocaleProvider` derleme (`next build`) sırasında sabit `DEFAULT_LOCALE = "tr"` ile çalıştığı için, üretilen `out/ar/index.html`, `out/pt/index.html` ve `out/en/index.html` dosyalarındaki görünür `<h1>`, adım başlıkları (`ADIM 1 · DİL SEÇİMİ`) ve `FAQPage` JSON-LD şeması **Türkçe** olarak basılıyordu!
  - Sayfadaki Arapça, Portekizce ve İngilizce metinler ise `<section hidden aria-hidden="true">` etiketi içine gizlenmişti. Googlebot ve `Google-Extended`, `hidden` ve `aria-hidden="true"` özniteliğine sahip DOM düğümlerini birincil sayfa içeriği olarak indekslemez.
* **Çözüm:** [src/lib/i18n/LocaleProvider.jsx](file:///d:/000Memorade/src/lib/i18n/LocaleProvider.jsx) bileşenine `initialLocale` prop desteği ve [src/components/seo/HomeSeo.jsx](file:///d:/000Memorade/src/components/seo/HomeSeo.jsx) bileşenine `forcedLocale` desteği eklendi. [src/app/ar/page.js](file:///d:/000Memorade/src/app/ar/page.js), [src/app/pt/page.js](file:///d:/000Memorade/src/app/pt/page.js) ve [src/app/en/page.js](file:///d:/000Memorade/src/app/en/page.js) sayfaları kendi dilleriyle sarmalanarak derleme anında **%100 görünür, doğal Arapça, Portekizce ve İngilizce HTML + JSON-LD** üretmesi sağlandı.

#### Kanıt 3: `robots.txt` İçinde `GoogleOther`, `anthropic-ai`, `Claude-Web` ve `LLMs-Txt` Bildirimi Eksikliği
* **Tespit:** Mevcut `robots.txt` çıktısında Google'ın Gemini araştırma/grounding tarayıcısı `GoogleOther`, `Google-CloudVertexBot`, Anthropic'in `anthropic-ai` / `Claude-Web` botları, `Perplexity-User`, `bingbot` ve dosya sonundaki `LLMs-Txt: https://memolandum.com/llms.txt` bildirimi yer almıyordu.
* **Çözüm:** [public/robots.txt](file:///d:/000Memorade/public/robots.txt) oluşturularak 14 arama ve yapay zeka botuna açık erişim (`Allow: /`) verildi ve dosya sonuna `Sitemap:`, `LLMs-Txt:` ve `LLMs-Full-Txt:` direktifleri eklendi.

#### Kanıt 4: `sitemap.xml` İçinde `xhtml:link hreflang` Eksikliği ve Kök `alternates` Uyumsuzluğu
* **Tespit ([src/app/sitemap.js](file:///d:/000Memorade/src/app/sitemap.js) & [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js)):**
  - `src/app/layout.js` içindeki `alternates.languages` hala `?lang=ar` sorgu parametrelerini işaret ediyordu.
  - `src/app/sitemap.js` içindeki URL'lerde çok dilli `alternates.languages` (`xhtml:link rel="alternate" hreflang="..."`) tanımlı değildi ve `/play/`, `/ar/play/`, `/pt/play/`, `/en/play/` derin linkleri sitemap'te yoktu.
* **Çözüm:** [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js) `buildPageAlternates("/")` ile senkronize edildi; [src/app/sitemap.js](file:///d:/000Memorade/src/app/sitemap.js) içine `tr`, `en`, `ar`, `ar-SA`, `ar-IQ`, `ar-EG`, `pt`, `pt-BR` ve `x-default` `alternates` haritalaması eklendi.

#### Kanıt 5: `<noscript>` Zengin Semantik Katmanı ve Dinamik Meta/Canonical Senkronizasyonu
* **Tespit:** JS çalıştırmadan hızlı tarama yapan AI botları için `<noscript>` özeti yoktu ve istemci tarafında dil değiştirildiğinde `document.title`, `<meta name="description">` ve `<link rel="canonical">` güncellenmiyordu.
* **Çözüm:** [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js) içine 4 dilde (EN, TR, AR, PT-BR) zengin semantik `<noscript>` özeti ve [src/lib/i18n/config.js](file:///d:/000Memorade/src/lib/i18n/config.js) içine dinamik `<title>`, `<meta name="description">` ve `<link rel="canonical">` senkronizasyonu eklendi.

---

## 4. Hazır Yapılandırma Kodları (Deliverables)

### 4.1. Google Gemini Knowledge Graph Uyumlu Birleşik `@graph` JSON-LD Kodu
> Kaynak: [src/lib/seo/jsonLd.js](file:///d:/000Memorade/src/lib/seo/jsonLd.js) (`buildKnowledgeGraphJsonLd()`) ve [src/app/layout.js](file:///d:/000Memorade/src/app/layout.js)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["EducationalOrganization", "Organization", "Brand"],
      "@id": "https://memolandum.com/#organization",
      "name": "Memolandum",
      "slogan": "Oyna, Ezberle · Play & Memorize · العب واحفظ · Jogue e Memorize",
      "url": "https://memolandum.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://memolandum.com/logo.png",
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "https://www.youtube.com/@memolandum",
        "https://www.instagram.com/memolandum",
        "https://www.linkedin.com/company/memolandum",
        "https://kreosus.com/httpsmemolandumcom/about",
        "https://github.com/ademmizrak/memolandum.com"
      ],
      "areaServed": ["TR", "IQ", "SA", "EG", "AE", "BR", "PT", "US", "GB", "DE", "KR", "JP", "Global"]
    },
    {
      "@type": ["WebApplication", "SoftwareApplication", "MobileApplication"],
      "@id": "https://memolandum.com/#app",
      "name": "Memolandum",
      "applicationCategory": ["EducationalApplication", "GameApplication"],
      "operatingSystem": "Web, iOS, Android",
      "url": "https://memolandum.com/",
      "inLanguage": ["tr", "en", "ar", "ar-IQ", "ar-SA", "ar-EG", "pt", "pt-BR", "de", "fr", "es", "it", "ru", "ko", "ja", "zh", "el", "ota"],
      "educationalLevel": "Primary School (Grades 1–4), Middle School (Grades 5–8 & LGS), High School (Grades 9–12), YKS/YDT, YDS/YÖKDİL, IELTS, TOEFL, KPSS, ENEM, Adult Language Learning (A1–C2)",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "TRY",
        "availability": "https://schema.org/InStock"
      }
    },
    {
      "@type": "VideoGame",
      "@id": "https://memolandum.com/#game",
      "name": "Memolandum — Vocabulary Arcade Games (Retro Shooter, OrbitLex & 10 Arcade Shells)",
      "applicationCategory": ["GameApplication", "EducationalApplication"],
      "url": "https://memolandum.com/games/",
      "hasPart": [
        { "@type": ["VideoGame", "LearningResource"], "name": "Retro Shooter (Kelime Uzay Nişancısı)", "url": "https://memolandum.com/games/shooter/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "OrbitLex (Yörünge Platformu & Eş/Zıt Anlamlılar)", "url": "https://memolandum.com/games/orbitlex/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Breakout (Kelime Kırma)", "url": "https://memolandum.com/games/breakout/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Highway Survivor (Kelime Otoyolu)", "url": "https://memolandum.com/games/highway/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Siberian Invaders (Kelime Savunması)", "url": "https://memolandum.com/games/invaders/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Word Ascent (Kelime Tırmanışı)", "url": "https://memolandum.com/games/wordascent/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Word Drop (Düşen Kelimeler)", "url": "https://memolandum.com/games/worddrop/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Retro Hangman (Kelime Tahmin)", "url": "https://memolandum.com/games/hangman/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Retro Yılan / Word Snake", "url": "https://memolandum.com/games/word-snake/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Star Trio Cards (Yıldız Kartlar)", "url": "https://memolandum.com/games/star-cards/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Wooden Word Board (Ahşap Kelime Panosu)", "url": "https://memolandum.com/games/word-board/" },
        { "@type": ["VideoGame", "LearningResource"], "name": "Word Card (Sesli & Görselli Kelime Kartları)", "url": "https://memolandum.com/games/word-card/" }
      ]
    }
  ]
}
```

### 4.2. Güncellenmiş `public/robots.txt`
> Kaynak: [public/robots.txt](file:///d:/000Memorade/public/robots.txt)

```txt
User-Agent: *
Allow: /
Disallow: /auth/
Disallow: /auth/action/
Disallow: /admin/

# Google Search, Google Gemini Grounding & AI Overviews
User-Agent: Googlebot
Allow: /
Disallow: /admin/

User-Agent: Google-Extended
Allow: /
Disallow: /admin/

User-Agent: GoogleOther
Allow: /
Disallow: /admin/

User-Agent: Google-CloudVertexBot
Allow: /
Disallow: /admin/

# OpenAI (ChatGPT & SearchGPT)
User-Agent: GPTBot
Allow: /
Disallow: /admin/

User-Agent: OAI-SearchBot
Allow: /
Disallow: /admin/

User-Agent: ChatGPT-User
Allow: /
Disallow: /admin/

# Anthropic (Claude)
User-Agent: ClaudeBot
Allow: /
Disallow: /admin/

User-Agent: anthropic-ai
Allow: /
Disallow: /admin/

User-Agent: Claude-Web
Allow: /
Disallow: /admin/

# Perplexity, Apple Intelligence & Microsoft Bing / Copilot
User-Agent: PerplexityBot
Allow: /
Disallow: /admin/

User-Agent: Perplexity-User
Allow: /
Disallow: /admin/

User-Agent: Applebot-Extended
Allow: /
Disallow: /admin/

User-Agent: bingbot
Allow: /
Disallow: /admin/

Host: https://memolandum.com
Sitemap: https://memolandum.com/sitemap.xml
LLMs-Txt: https://memolandum.com/llms.txt
LLMs-Full-Txt: https://memolandum.com/llms-full.txt
```

### 4.3. Sıkılaştırılmış `firestore.rules` (Denial-of-Wallet Limitleri Dahil)
> Kaynak: [firestore.rules](file:///d:/000Memorade/firestore.rules)

```javascript
// Fatura Şişirme (Denial of Wallet) Korumalı Okuma Limitleri:
match /users/{userId}/stats/global {
  allow get: if true;
  allow list: if request.query.limit != null && request.query.limit <= 50;
  // ... şema ve aralık doğrulamaları
}
match /usernames/{username} {
  allow get: if true;
  allow list: if request.query.limit != null && request.query.limit <= 20;
  // ...
}
match /leaderboard/{userId} {
  allow get: if true;
  allow list: if request.query.limit != null && request.query.limit <= 50;
  // ...
}
match /{path=**}/stats/{statId} {
  allow get: if statId == 'global';
  allow list: if statId == 'global' && request.query.limit != null && request.query.limit <= 50;
}
```
