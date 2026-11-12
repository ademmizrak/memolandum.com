# Product Requirement Document (PRD)
## YouTube Shorts & memolandum.com Entegrasyonu

---

## 1. Proje Amacı & Vizyonu
Bu projenin amacı; `@memolandum` YouTube kanalı üzerinden yayınlanan eğitici/öğretici Shorts videolarını (görsel, işitsel ve animasyon içerikli) otomatik olarak **memolandum.com** üzerindeki ilgili ders ve oyun seviyeleriyle ilişkilendirmektir. Bu entegrasyon sayesinde:
*   YouTube kanalı aracılığıyla elde edilen organik trafik, web/mobil uygulamaya yönlendirilerek doğrudan dönüşüm hunisi (funnel) oluşturulacaktır.
*   Kullanıcıların kelimeleri daha akılda kalıcı yöntemlerle (görsel-işitsel) pekiştirmesi sağlanacaktır.
*   İçerik üreticisinin operasyonel yükü sıfıra indirilerek tamamen otomatik bir senkronizasyon altyapısı sunulacaktır.

---

## 2. Hedef Kitle ve Video Kategorileri
Sistemde ilk aşamada belirlenen 4 temel eğitim kademesi (oynatma listesi) bulunacaktır:
1.  **2. Sınıf İngilizce Kelimeler**
2.  **3. Sınıf İngilizce Kelimeler**
3.  **4. Sınıf İngilizce Kelimeler**
4.  **YDS İngilizce Kelimeler**

Her bir kategori için günde 1 video (toplamda günde 4 video) yayınlanması ve bu videoların günün farklı saatlerine yayılarak planlanması hedeflenmektedir.

---

## 3. Fonksiyonel Gereksinimler & Kullanıcı Deneyimi (UX) Akışı

### 3.1. Akış Kurgusu (Ünite ve Kelime Akışı)
*   **Ünite Yapısı:** Her kategori (2. Sınıf, 3. Sınıf, 4. Sınıf ve YDS) 10 üniteden oluşur. Her ünitede tam 10 kelime yer alır.
*   **1. Aşama - Görsel Öğrenme (Kelimeler 1-10):** Kullanıcı, kelimeleri sırayla statik görseli, yazılışı ve sesli telaffuzu ile öğrenir/çalışır.
*   **2. Aşama - Video ile Pekiştirme (Aynı Sırada):** 10 kelimelik ilk aşama bittiğinde, kullanıcı siteden ayrılmadan otomatik olarak **"Video ile Pekiştirme"** moduna geçer.
    *   Kelime sırası değişmeden, bu kez aynı 10 kelime için hazırlanmış olan 15-30 saniyelik **YouTube Shorts videosu** ekranda (görselin yerinde) oynatılır.
    *   Kullanıcı her videoyu izledikten/geçtikten sonra bir sonraki kelimenin videosuna ilerler.
*   **3. Aşama - Kapanış ve Yönlendirme:** 10 videoluk pekiştirme turu bittiğinde tebrik ekranı görüntülenir. Bu ekranda **"Videolarla devam et" (YouTube'da İzle)** butonu yer alır. Bu buton, kullanıcının ilgili kategorideki YouTube Shorts oynatma listesine (playlist) gitmesini sağlar.

### 3.2. Otomatik Senkronizasyon (Eşleştirme Algoritması)
*   **Periyodik Tarama:** Sistem, günde bir veya iki kez otomatik olarak `@memolandum` kanalının oynatma listelerini (Playlists) sorgular.
*   **Kelime-Video Eşleştirme Kuralları:**
    *   **İsim/Kelime Bazlı Eşleşme (Otomatik):** Yüklenen her Shorts videosunun başlığı veya açıklamasındaki etiket (örn: `#abandon`), veritabanında yer alan kelime ile otomatik eşleştirilir.
    *   **Playlist Bazlı Süzme:** Videonun ait olduğu oynatma listesi (örn: *2. Sınıf İngilizce Kelimeler*), kelimenin ait olduğu paket/seviye ile eşleştirilir.
    *   Bu sayede içerik üreticisiniz sadece YouTube'a video yüklerken kelime etiketini (hashtag) açıklamaya yazar, sistem videoyu otomatik olarak ilgili kelime kartına yerleştirir.

---

## 4. Teknik Mimari ve Gereksinimler

### 4.1. Yetkilendirme & Güvenlik
*   **API Erişimi:** YouTube Data API v3 üzerinden bir **API Key (API Anahtarı)** kullanılacaktır. Bu anahtar oluşturulmuş ve `.env`, `.env.local` ile `.env.production` dosyalarına `YOUTUBE_API_KEY` ve `NEXT_PUBLIC_YOUTUBE_API_KEY` olarak tanımlanmıştır.
*   **Hesap Bilgileri:** API anahtarı, `ademmizrak@gmail.com` adresine bağlı mevcut Google Developer Console hesabından oluşturulmuştur (info@memolandum.com için yeni bir hesaba gerek olmadığı doğrulanmış ve uygulanmıştır).
*   **CORS Ayarları:** GCS üzerinde güncellenen CORS politikası (`*` izinli) sayesinde, tüm ortamlardan sorunsuz erişim sağlanmıştır.

### 4.2. Veri Modeli ve Depolama (Firestore & JSON)
Her bir kelime nesnesine isteğe bağlı bir `youtubeVideoId` alanı eklenir veya ilişkili koleksiyondan beslenir:
```typescript
interface WordItem {
  word: string;             // İngilizce kelime (örn: "abandon")
  translation: string;      // Türkçe karşılığı
  image?: string;           // Statik görsel URL'si
  audio?: string;           // Ses telaffuz URL'si
  youtubeVideoId?: string;  // Eşleşen YouTube Shorts Video ID'si (örn: "abc123XYZ")
}
```
*   **Önbellekleme (Caching):** API çağrı limitlerini korumak için, güncel video eşleşme listesi Firestore'da veya CDN'de önbelleğe alınmış bir JSON dosyasında tutulur ve istemci tarafından tek seferde çekilir.

---

## 5. Uygulama ve Dağıtım Adımları

*   **Aşama 1: Hazırlık (Kullanıcı Tarafı)**
    *   YouTube kanalında 4 ana oynatma listesinin oluşturulması.
    *   İlk videoların (örneğin ilk ünite için 10 adet video) yüklenmesi. Açıklama kısmına kelime etiketlerinin (örn. `#abandon`) eklenmesi.
    *   `ademmizrak@gmail.com` ile Google Cloud Console üzerinden YouTube Data API v3'ün aktifleştirilip API Key oluşturulması.

*   **Aşama 2: Senkronizasyon Scriptinin & Firestore Şemasının Hazırlanması**
    *   Günde bir kere çalışıp YouTube oynatma listelerindeki yeni videoları tarayan ve kelime eşleşmelerini veri dosyalarımıza (`youtubeVideoId` olarak) yazan scriptin hazırlanması.

*   **Aşama 3: Arayüz ve Oyun Motoru Güncellemesi**
    *   Kelime çalışma motorunun (Learning Engine) 10 kelimeden sonra "Video ile Pekiştirme" moduna geçecek şekilde güncellenmesi.
    *   Görsel alanına YouTube Shorts (dikey) Iframe Player entegrasyonu yapılması.
    *   Ünite sonu ekranına YouTube oynatma listesi yönlendirme butonunun eklenmesi.

*   **Aşama 4: Test ve Canlıya Geçiş**
    *   Otomatik video çekme ve eşleştirme testleri.
    *   `npm run deploy:app` ile güncellemenin yayına alınması.

