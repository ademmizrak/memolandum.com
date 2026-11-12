# Memolandum QA & Test Kılavuzu (Mobil Geçiş Sürümü)

Bu kılavuz, **Memolandum** responsive web uygulamasının **Capacitor** altyapısı kullanılarak başarılı bir şekilde mobilize edilmesinin ardından, QA (Kalite Güvence) ve Test uzmanlarımızın mobil platformlarda (iOS & Android) gerçekleştireceği doğrulama testlerini yönlendirmek amacıyla hazırlanmıştır.

---

## 1. Proje Nedir?
**Memolandum**, oyunlaştırılmış (Arcade-native) bir kelime öğrenme ve hafıza güçlendirme uygulamasıdır. Kullanıcıların öğrendikleri veya anlık çeviriyle kaydettikleri kelimeleri **Ebbinghaus (Spaced Repetition)** tabanlı **Memolandum Pulse™** algoritmasıyla takip eder ve en uygun zamanlarda oyunlarla tekrar ettirerek uzun süreli hafızaya aktarır.

---

## 2. Teknolojik Altyapı
* **Frontend**: Next.js (Turbopack) & Vanilla CSS/Tailwind (Statik İhraç - `output: 'export'`)
* **Backend**: Firebase Suite (Authentication, Firestore Database, Cloud Functions)
* **Mobil Köprü**: Capacitor (iOS & Android native webview entegrasyonu)
* **Veri Depolama**: Zustand (State Management) + `@capacitor/preferences` (Asenkron yerel depolama)
* **Ödeme Entegrasyonu**: RevenueCat SDK (`@revenuecat/purchases-capacitor`)
* **Bildirimler**: `@capacitor/local-notifications`
* **Cihaz Donanımı**: `@capacitor/haptics` (Dokunsal Titreşim), `@capacitor/keyboard` (Klavye Boyutlandırma), `@capacitor/splash-screen` (Açılış Ekranı)

---

## 3. Yapılan Geliştirmeler ve Test Senaryoları

Test uzmanlarımızın cihazlarda (veya emülatörlerde) doğrulaması gereken 5 kritik test başlığı aşağıda listelenmiştir:

### Senaryo 1: Veri Temeli ve Çevrimdışı Çalışma (Offline Data Foundation)
* **Ne Yapıldı?**: Zustand state yapısı `@capacitor/preferences` ile asenkron hibrit depolamaya geçirildi. Firestore istemci tarafında offline persistence (çevrimdışı önbellekleme) aktif edildi.
* **Nasıl Test Edilir?**:
  1. Uygulamaya giriş yapın ve kasanıza birkaç kelime ekleyin.
  2. Cihazın internetini tamamen kapatın (Uçak modu).
  3. Uygulamayı tamamen kapatıp (kill/swipe-up) yeniden açın.
  4. **Beklenen Sonuç**: Oturumunuzun düşmemesi, kelimelerinizin eksiksiz listelenmesi ve internet yokken de Arcade oyunlarını oynayabilmeniz gerekir. İnternet geri geldiğinde veriler Firebase'e otomatik senkronize olmalıdır.

### Senaryo 2: Native Kimlik Doğrulama (Auth Bridge)
* **Ne Yapıldı?**: Mobil cihazlarda tarayıcı yönlendirmeli (redirect) giriş hatalarını aşmak için native kimlik doğrulama köprüleri kuruldu.
* **Nasıl Test Edilir?**:
  * **Android**: Google ile Giriş butonuna tıklandığında tarayıcı açılmadan doğrudan native Google hesap seçici penceresi gelmeli ve Firebase oturumu açılmalıdır.
  * **iOS (Kritik Apple Kuralı)**: iOS uygulamasında "Apple ile Devam Et" butonu görünmelidir (Android ve Web'de gizlidir). Butona tıklandığında native FaceID/TouchID ile giriş penceresi açılmalı ve Firebase oturumu başarıyla doğrulanmalıdır.

### Senaryo 3: Mobil Ödeme ve Premium (RevenueCat IAP)
* **Ne Yapıldı?**: Web'de çalışan Shopier/Stripe ödeme yönlendirmeleri devredışı bırakıldı. Mobil platformlarda doğrudan App Store ve Google Play faturalandırma sistemlerini tetikleyen RevenueCat SDK entegre edildi.
* **Nasıl Test Edilir?**:
  1. Test cihazında bir Sandbox/Test hesabı ile oturum açın.
  2. Premium/Checkout sayfasına gidin ve abonelik butonuna tıklayın.
  3. **Beklenen Sonuç**: Web sitesine yönlendirilmek yerine doğrudan App Store/Google Play native satın alma onay penceresi gelmelidir.
  4. Satın alım test modunda onaylandığında, Zustand store anında güncellenmeli ve Premium özellikler aktifleşmelidir.

### Senaryo 4: Yerel Bildirimler ve Tutundurma (SRS Reminders)
* **Ne Yapıldı?**: `@capacitor/local-notifications` ile Ebbinghaus eğrisine göre dinamik push bildirimleri kuruldu.
* **Nasıl Test Edilir?**:
  1. Uygulamaya ilk girişte bildirim izni istenmelidir. İzin verin.
  2. Kasanızdaki kelimelerin durumunu değiştirin (örneğin bazı kelimeleri yanlış bilerek "due" yani tekrar edilmesi gereken durumuna getirin).
  3. Her akşam saat 20:00'de bildirim tetiklenecek şekilde ayarlanmıştır.
  4. **Beklenen Sonuç**: Kasanızda tekrar edilmeyi bekleyen kelimeler varken bildirim içeriği *"Kasanızda tekrar edilmeyi bekleyen X kelime var..."* olmalı, tüm tekrarlar yapıldığında ise genel davet mesajı göstermelidir.

### Senaryo 5: Native Deneyim ve Arayüz Cilası (Polish & UX)
* **Ne Yapıldı?**: Splash screen geçişleri, klavye daralmaları ve haptic dokunsal geri bildirimler ayarlandı.
* **Nasıl Test Edilir?**:
  * **Haptic Geri Bildirim**: Arcade oyunlarında (örneğin Breakout veya Shooter) bir kelimeye doğru cevap verdiğinizde cihazda hafif bir native tık sesi/titreşimi (`ImpactStyle.Light`), yanlış cevapta ise hata titreşimi (`NotificationType.Error`) hissetmelisiniz.
  * **Klavye Kontrolü**: Kelime ekleme veya arama alanlarına tıklayıp klavyeyi açtığınızda, ekranın klavye altında kalıp kalmadığını kontrol edin. WebView klavye açıldığında daralmalı ve girdi alanları görünür kalmalıdır.
  * **Splash Screen**: Uygulama açılırken Next.js sayfası tamamen yüklenip hazır olana kadar native logo ekranında beklemeli, ardından kesintisiz bir geçişle arayüz açılmalıdır (ara boş beyaz ekran kaybolmalıdır).

---

## 4. Katmanlı ilerleme (alt katmanı bozmadan)

Üst katman, alt katmanın kabul kriterlerini **geri alamaz / kırmaz**. Web Shopier/Stripe yolu her katmanda korunur.

| Katman | Durum | Kapsam | Alt katmanı bozmama kuralı |
|--------|--------|--------|----------------------------|
| **L0** | ✅ | Android `POST_NOTIFICATIONS`; bildirim no-op; logout’ta Preferences + localStorage temizliği | — |
| **L1** | ✅ | RevenueCat await bootstrap, restore, native UI ayrımı; Firestore’un RC premium’u ezmemesi | L0 logout/bildirim yollarına dokunma; web checkout aynı |
| **L2** | ✅ | Splash hard fallback; bildirim izni bağlamsal (kasa doluyken) | L0 no-op + L1 RC bootstrap’a dokunma |
| **L3** | ✅ / ⏳ RC key | Firebase Android+iOS app; `google-services.json`; `GoogleService-Info.plist`; Apple Sign In entitlements; debug SHA-1/256; GoogleAuth serverClientId | L0–L2 kod yollarına dokunma |
| **L4** | ⏳ Sonra | RC → Firestore webhook / sunucu entitlement | L1 client restore/sync çalışmaya devam etmeli |
| **L5** | ⏳ Sonra | `TESTING_GUIDE` senaryo matrisi (cihaz QA) | Kod “yeniden mimari” yok; sadece doğrulama |

**Sıra kilidi:** L3 config olmadan L5 Auth/IAP “pass” sayılmaz; L4 webhook olmadan çok cihazlı premium senkronu garanti edilmez — ama tek cihaz RC sync (L1) yeterli kalır.

### L3 tamamlananlar (memolandum-33dc4)
- Android app: `1:539033091302:android:f8a0dab169b146472bcf27` → `android/app/google-services.json`
- iOS app: `1:539033091302:ios:13706ab1ae4ba3722bcf27` → `ios/App/App/GoogleService-Info.plist` (Xcode Resources’a bağlı)
- Debug keystore SHA-1/SHA-256 Firebase’e eklendi (release imza için yeni SHA gerekir)
- `ios/App/App/App.entitlements` → Sign in with Apple (`CODE_SIGN_ENTITLEMENTS`)
- `Info.plist` URL scheme + `GIDClientID`; `capacitor.config.json` → GoogleAuth `serverClientId`

### L3 sende kalan (secret — commit etme)
`.env.local` / CI’ye gerçek değerler:
```bash
NEXT_PUBLIC_REVENUECAT_IOS_KEY=appl_...
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
```
RevenueCat dashboard’da entitlement id: **`premium`**. Placeholder key ile IAP configure edilmez (L1 koruması).

Apple Developer: bundle `com.memolandum.app` için **Sign in with Apple** capability (portal + Xcode team) açılmalı — entitlements dosyası hazır.

---

## 5. Geliştirici & QA Derleme Komutları
Web kodlarındaki değişikliklerin native platformlara aktarıldığından emin olmak için derleme ve eşitleme adımları:

```bash
# 1. Next.js üretimi statik çıktısını derler ('out' dizini oluşturur)
npm run build

# 2. Web kodlarını Android ve iOS native paket dizinlerine kopyalar ve eklentileri eşitler
npx cap sync
```
