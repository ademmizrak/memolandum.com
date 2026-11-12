# Memolandum (v1.0.0) — Google Play Console Yükleme Rehberi

Bu klasörde (`d:\000Memorade\play-store-release\`) Google Play Console'a yüklemeniz gereken tüm dosyalar hazır durumdadır:
- **Uygulama Paketi (AAB):** `Memolandum-v1.0.0-release.aab` (`versionCode: 1`, `versionName: "1.0.0"`)
- **Uygulama İkonu (512x512 PNG):** `icon-512x512.png`
- **Özel Grafik / Feature Graphic (1024x500 PNG):** `feature-graphic-1024x500.png`

---

## Adım 1: Google Play Console'da Uygulama Oluşturma
1. [Google Play Console](https://play.google.com/console) adresine girin ve **"Uygulama oluştur"** butonuna tıklayın.
2. Bilgileri aşağıdaki gibi doldurun:
   - **Uygulama adı:** `Memolandum`
   - **Varsayılan dil:** `Türkçe (tr-TR)`
   - **Uygulama veya oyun:** `Oyun` (veya `Uygulama` -> `Eğitim`)
   - **Ücretsiz veya ücretli:** `Ücretsiz`
3. Geliştirici Program Politikaları ve ABD İhracat Yasaları kutucuklarını işaretleyip **"Uygulama oluştur"** deyin.

---

## Adım 2: Gizlilik Politikası ve Uygulama İçeriği ( Politika -> Uygulama İçeriği )

### 1. Gizlilik Politikası (Privacy Policy)
- **Gizlilik Politikası URL'si:**
  ```text
  https://memolandum.com/legal/privacy
  ```

### 2. Uygulama Erişimi (App Access)
- **"Uygulamanızın bazı bölümleri kısıtlı mı?"** sorusuna:
  - **"Tüm işlevler herhangi bir kısıtlama olmadan kullanılabilir"** (veya *"Bazı işlevler kısıtlıdır"* seçip: *"Tüm kelime oyunları ve 23 dil yolu misafir modunda giriş yapmadan tamamen açıktır. Google veya e-posta ile ücretsiz hesap oluşturulabilir."*) seçeneğini işaretleyin.

### 3. Reklamlar (Ads)
- **"Hayır, uygulamam reklam içermiyor"** seçeneğini işaretleyin.

### 4. Veri Güvenliği (Data Safety) ve Hesap Silme URL'si
- **Veri topluyor veya paylaşıyor musunuz?** -> `Evet`
- **Toplanan veriler aktarım sırasında şifreleniyor mu (HTTPS)?** -> `Evet`
- **Kullanıcılar verilerinin silinmesini talep edebilir mi?** -> `Evet`
- **Uygulama içi ve Web üzerinden Hesap Silme URL'si:**
  ```text
  https://memolandum.com/delete-account
  ```
- **Toplanan Veri Türleri:**
  - **Kişisel Bilgiler -> Ad ve E-posta Adresi:** *Toplanır (Yalnızca kullanıcı hesap oluşturduğunda) · Uygulama işlevselliği ve hesap yönetimi için · Paylaşılmaz.*
  - **Kişisel Bilgiler -> Kullanıcı Kimlikleri (Firebase UID):** *Toplanır · Uygulama işlevselliği ve kelime ilerlemesi senkronizasyonu için · Paylaşılmaz.*
  - **Ses Dosyaları (Mikrofon):** *Geçici olarak işlenir (Anlık Çeviri sesli giriş özelliği kullanıldığında konuşmayı metne dönüştürmek için anlık işlenir, sunucuda saklanmaz).*

### 5. Devlet Uygulamaları / Finansal Özellikler / Sağlık
- Hepsi için **"Hayır"** işaretleyin.

---

## Adım 3: Ana Mağaza Girişi ( Büyüme -> Mağaza varlığı -> Ana mağaza girişi )

- **Uygulama Adı:**
  ```text
  Memolandum: Kelime & Dil Oyunu
  ```
- **Kısa Açıklama (En fazla 80 karakter):**
  ```text
  23 dil yolu, MEB & YDS/KPSS kelimeleri, retro arcade oyunlar ve anlık çeviri!
  ```
- **Tam Açıklama (Kopyala-Yapıştır):**
  ```text
  Memolandum, kelime ezberlemeyi sıkıcı listelerden çıkarıp 10'dan fazla retro arcade oyuna ve bilimsel aralıklı tekrar (Spaced Repetition) sistemine dönüştüren yeni nesil dil ve kavram öğrenme platformudur.

  🚀 ÖNE ÇIKAN ÖZELLİKLER:
  • 23 Dil Yolu: İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Rusça, Arapça, Japonca, Korece, Çince, Yunanca, Portekizce ve Osmanlı Türkçesi dahil 23 farklı dil yönünde binlerce kelime ve cümle.
  • MEB Müfredatı & Sınav Hazırlık: 2. sınıftan 12. sınıfa ünite bazlı MEB İngilizce kelimeleri, YDS, YÖKDİL, YKS-DİL ve KPSS kavram sözlüğü.
  • 10+ Retro Arcade Oyun Kabuğu: Retro Shooter, Breakout DX-Ball, Highway Survivor, Siberian Invaders, Reverse Word Drop, Word Ascent, Kelime Kartları, Retro Yılan ve Adam Asmaca ile oynayarak öğrenin.
  • +10.000 Stüdyo Ses Kaydı & Yerel Telaffuz: Her kelimeyi doğru telaffuzuyla dinleyin, görsel hafıza kartlarıyla kalıcı hale getirin.
  • Kelime Kasası & Veli Başarı Karnesi: Öğrendiğiniz kelimeleri takip edin, zayıf kelimelerinizi özel tekrar oyunlarıyla güçlendirin ve gelişim karnenizi paylaşın.
  • Öğretmen Masası: Öğretmenler sınıflarını oluşturup öğrencilerine ünite bazlı kelime ödevleri atayabilir.
  • Anlık Çeviri Stüdyosu: Sesli ve yazılı çok dilli çeviri desteği.
  ```
- **Görseller:**
  - **Uygulama İkonu:** Bu klasördeki `icon-512x512.png` dosyasını yükleyin.
  - **Özel Grafik (Feature Graphic):** Bu klasördeki `feature-graphic-1024x500.png` dosyasını yükleyin.
  - **Ekran Görüntüleri:** Telefon ve tablet ekran görüntülerini yükleyin.

---

## Adım 4: AAB Paketini Yükleme ( Test ve Yayın -> Üretim veya Kapalı Test )
1. Sol menüden **Üretim** (veya **Kapalı Test / Dahili Test**) sekmesine gidin ve **"Yeni sürüm oluştur"** butonuna tıklayın.
2. **Uygulama paketleri (App bundles)** alanına bu klasördeki şu dosyayı sürükleyip bırakın:
   - `d:\000Memorade\play-store-release\Memolandum-v1.0.0-release.aab`
3. **Sürüm notları (Release notes):**
   ```text
   <tr-TR>
   Memolandum v1.0.0 ilk Google Play sürümü!
   - 23 dil yolu ve MEB/YDS/KPSS kelime paketleri
   - 10+ retro arcade kelime oyunu ve görsel kelime kartları
   - Stüdyo ses kayıtları, yerel sesli telaffuz ve anlık çeviri
   - Kelime Kasası, Öğretmen Masası ve Veli Başarı Karnesi
   </tr-TR>
   ```
4. **"İleri"** -> **"Kaydet ve Yayınla"** butonuna tıklayarak incelemeye gönderin.

---

## ⚠️ Önemli Not: Google Play App Signing (Google Giriş İçin Son Adım)
Uygulamayı Play Console'a yükledikten sonra Google Play kendi **Uygulama İmzalama Anahtarını (App Signing Key)** oluşturur.
Play Store'dan indirilen uygulamada **Google ile Giriş** özelliğinin çalışması için:
1. Google Play Console -> **Test ve Yayın** -> **Uygulama Bütünlüğü (App Integrity)** -> **Uygulama İmzalama (App Signing)** sayfasına gidin.
2. Oradaki **"Uygulama imzalama anahtarı sertifikası (App signing key certificate)"** altındaki **SHA-1** ve **SHA-256** kodlarını kopyalayıp bana buraya yapıştırın; ben de CLI üzerinden tek komutla Firebase projenize ekleyeyim!
