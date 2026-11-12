import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTROLLER_NAME,
  LEGAL_LAST_UPDATED,
  LEGAL_URLS,
} from "./config";

/**
 * Nihai Gizlilik Politikası — tek metin: web + Android/iOS (+ PWA).
 * Mağaza Data safety / App Privacy formları bu metinle hizalanmalı.
 */
export function getPrivacyDoc(locale = "tr") {
  const en = locale === "en";
  return {
    title: en ? "Privacy Policy" : "Gizlilik Politikası",
    lastUpdated: LEGAL_LAST_UPDATED,
    intro: en
      ? `This Privacy Policy applies to the Memolandum Service as a whole: the website at memolandum.com, progressive web use, and Memolandum mobile applications on Android and iOS when published (together, the “Service”). We do not maintain a separate “app-only” privacy policy — one clear document covers all surfaces. ${LEGAL_CONTROLLER_NAME} (“we”, “us”) wants learning to stay joyful while handling data carefully.`
      : `Bu Gizlilik Politikası Memolandum Hizmetinin tamamına uygulanır: memolandum.com web sitesi, progressive web kullanım ve yayımlandığında Android / iOS Memolandum mobil uygulamaları (birlikte “Hizmet”). Ayrı bir “yalnızca uygulama” gizlilik politikası tutmayız — tek net belge tüm yüzeyleri kapsar. ${LEGAL_CONTROLLER_NAME} (“biz”) öğrenmeyi keyifli tutarken veriyi özenle işler.`,
    sections: [
      {
        heading: en ? "1. Who we are & contact" : "1. Kimiz ve iletişim",
        body: en
          ? `The Service is operated under the Memolandum brand. Privacy requests (access, correction, deletion help): ${LEGAL_CONTACT_EMAIL}. Canonical policy URL (use this in App Store / Play Console): ${LEGAL_URLS.privacy}.`
          : `Hizmet Memolandum markası altında işletilir. Gizlilik talepleri (erişim, düzeltme, silme yardımı): ${LEGAL_CONTACT_EMAIL}. Kanonik politika URL’si (App Store / Play Console’a bunu yazın): ${LEGAL_URLS.privacy}.`,
      },
      {
        heading: en ? "2. At a glance" : "2. Kısa özet",
        body: en
          ? "• Same rules on web and in apps. • Guest play keeps most data on your device. • Sign-in enables cloud sync (progress, vault, study profiles). • AI translation is sent to Google Gemini only when you use that feature; saving to your vault is optional. • Microphone is used only if you choose voice input. • You can sign out anytime; you can delete your account in Profile (same control in future apps). • We do not sell your personal information."
          : "• Web ve uygulamada aynı kurallar. • Misafir oyunda veri çoğunlukla cihazınızda. • Giriş; ilerleme, kasa ve çalışma profillerinin bulut senkronunu açar. • YZ çeviri yalnızca o özelliği kullanınca Google Gemini’ye gider; kasaya kayıt isteğe bağlıdır. • Mikrofon yalnızca sesli girdiyi seçerseniz kullanılır. • İstediğiniz zaman çıkış; hesabı Profil’den silebilirsiniz (gelecek uygulamalarda aynı kontrol). • Kişisel verilerinizi satmayız.",
      },
      {
        heading: en ? "3. Categories of data" : "3. Veri kategorileri",
        body: en
          ? "We may process: (a) Account info — email, display name, profile photo (email/password or Google Sign-In; on iOS we may also offer Sign in with Apple when required by platform rules); (b) Learning & gameplay — XP, scores, gems, levels, study-language profiles, word-vault entries when signed in (Cloud Firestore); (c) User content for translation — text or voice you submit for instant translation; (d) Audio — microphone capture only during voice translation you start; audio is used to produce text/translation and is not kept as a permanent voice archive in our product after the request completes, unless you save resulting text to your vault; (e) Identifiers & security — Firebase Auth user id, App Check / reCAPTCHA signals, and on mobile app instances device/app instance identifiers needed for Firebase/Google security and analytics SDKs; (f) Diagnostics & analytics — aggregated usage via Google Analytics for Firebase; crash/performance data if we enable Firebase Crashlytics or similar on a platform; (g) Local device storage — UI language, theme, guest progress (localStorage / app local storage); (h) Billing metadata — Premium status, provider (Shopier/Stripe), period end, payment reference ids. Card numbers and CVV are never collected by Memolandum — only on PCI-compliant Shopier (Türkiye) and/or Stripe hosted pages. Arcade learning on static databases stays free; AI translation beyond the free trial is Premium. We do not require precise GPS location."
          : "İşleyebileceklerimiz: (a) Hesap — e-posta, görünen ad, profil fotoğrafı (e-posta/şifre veya Google; iOS’ta Sign in with Apple sunulabilir); (b) Öğrenme ve oyun — XP, skor, gem, seviye, dil profilleri, kelime kasası; (c) Çeviri içeriği — metin veya ses; (d) Ses — yalnızca sesli çeviride mikrofon; kalıcı ses arşivi tutulmaz; (e) Kimlikleyiciler ve güvenlik — Auth uid, App Check / reCAPTCHA; (f) Analitik — Firebase Analytics; (g) Yerel depolama — dil, tema, misafir ilerleme; (h) Faturalama meta — Premium durumu, Shopier/Stripe, dönem sonu, ödeme referansları. Kart numarası/CVV Memolandum’da toplanmaz — PCI uyumlu Shopier (TR) ve/veya Stripe sayfalarında. Statik veritabanıyla arcade öğrenme bedava; ücretsiz deneme sonrası AI çeviri Premium. Hassas GPS istemeyiz.",
      },
      {
        heading: en ? "4. Purposes & legal bases" : "4. Amaçlar ve hukuki dayanaklar",
        body: en
          ? "We process data to: provide and sync the Service you request (contract / steps prior to contract); secure the Service, prevent abuse, and keep leaderboards reasonably fair (legitimate interests, balanced with your rights); understand aggregated usage and improve learning quality and stability (legitimate interests); and meet legal obligations when required. Where a specific optional technology legally requires consent in your region, we will request it in a compliant way when that flow ships."
          : "Veriyi şunlar için işleriz: talep ettiğiniz Hizmeti sunmak ve senkronlamak (sözleşme / sözleşme öncesi adımlar); Hizmeti güvenceye almak, kötüye kullanımı önlemek, liderliği makul ölçüde adil tutmak (haklarınızla dengeli meşru menfaat); toplu kullanımı anlayıp öğrenme kalitesi ve kararlılığı artırmak (meşru menfaat); gerektiğinde hukuki yükümlülük. Bölgenizde belirli isteğe bağlı teknoloji için açık rıza gerekiyorsa, ilgili akış geldiğinde uyumlu şekilde isteriz.",
      },
      {
        heading: en ? "5. AI processing (Gemini)" : "5. YZ işleme (Gemini)",
        body: en
          ? "When you use instant translation, the content of that request is sent to Google Gemini through Firebase AI Logic to generate a response. Do not submit secrets or sensitive data you are unwilling to process via Google. We store translation-related text in your Memolandum vault only if you explicitly save it. AI outputs can be inaccurate; see also our Terms of Service."
          : "Anlık çeviriyi kullandığınızda istek içeriği, yanıt üretmek için Firebase AI Logic üzerinden Google Gemini’ye gönderilir. Google üzerinden işlenmesini istemediğiniz sırları veya hassas verileri göndermeyin. Çeviriyle ilgili metni Memolandum kasasına yalnızca siz açıkça kaydederseniz yazarız. YZ çıktıları hatalı olabilir; Kullanım Koşullarımıza da bakın.",
      },
      {
        heading: en ? "6. Processors & transfers" : "6. İşleyenler ve aktarım",
        body: en
          ? "Core processors include Google (Firebase Authentication, Cloud Firestore, Hosting, Cloud Functions, App Check, Analytics; Gemini via Firebase AI Logic; Google Sign-In); Shopier for Türkiye card/local payments; and Stripe for international card payments. On Apple platforms, Sign in with Apple is provided by Apple when enabled. Payment processors receive the billing data needed to complete checkout under their own privacy terms. Data may be processed in data centers outside your country under those providers’ terms and safeguards. We do not sell personal information. We do not use your vault or translation content to publicly identify you for third-party advertising beyond standard aggregated Analytics."
          : "Temel işleyenler: Google (Firebase Authentication, Cloud Firestore, Hosting, Cloud Functions, App Check, Analytics; Firebase AI Logic üzerinden Gemini; Google Sign-In); Türkiye kart/yerel ödemeleri için Shopier; uluslararası kart için Stripe. Apple platformlarında etkinse Sign in with Apple Apple tarafından sağlanır. Ödeme sağlayıcıları, kendi gizlilik şartları altında ödeme için gerekli faturalama verisini alır. Veri ülkeniz dışında işlenebilir. Kişisel verileri satmayız. Kasa/çeviri içeriğini standart toplu Analytics dışında reklam kimliklendirmesi için kullanmayız.",
      },
      {
        heading: en ? "7. Local storage, sync & sessions" : "7. Yerel depolama, senkron ve oturum",
        body: en
          ? "Guest progress may stay on-device. After sign-in we may merge eligible guest progress into your cloud account and sync vault/stats. Auth sessions use long-lived local persistence until you sign out, delete the account, or clear app/site data. Sign-out ends the session on that device without deleting cloud data."
          : "Misafir ilerleme cihazda kalabilir. Girişten sonra uygun misafir ilerleme buluta birleştirilebilir; kasa/istatistikler senkronlanır. Auth oturumları; çıkış, hesap silme veya site/uygulama verisini temizleyene kadar uzun ömürlü yerel kalıcılık kullanır. Çıkış, bulutu silmeden o cihazdaki oturumu bitirir.",
      },
      {
        heading: en ? "8. Retention" : "8. Saklama",
        body: en
          ? "Account and learning data are kept while the account is active and as needed to operate the Service. After account deletion (§9), primary cloud records tied to your user id are removed; provider logs/backups may remain briefly for security and legal compliance, then follow those providers’ cycles. Local leftovers can be cleared by uninstalling the app or clearing site data."
          : "Hesap ve öğrenme verileri hesap aktifken ve Hizmeti işletmek için gerekli olduğu sürece tutulur. Hesap silindikten sonra (§9) kullanıcı id’nize bağlı birincil bulut kayıtları kaldırılır; sağlayıcı günlük/yedekleri güvenlik ve hukuki uyum için kısa süre kalabilir, ardından sağlayıcı döngülerine girer. Yerel artıkları uygulamayı kaldırarak veya site verisini temizleyerek silebilirsiniz.",
      },
      {
        heading: en ? "9. Your rights & account deletion" : "9. Haklarınız ve hesap silme",
        body: en
          ? `In the Service you can view/update profile fields and manage your vault while signed in. You may sign out; clear local storage; revoke Google (or Apple) sign-in in that provider’s account settings; and permanently delete your account via Profile → Delete account — the same product control is intended on mobile apps. Deletion requires recent re-authentication, then a Cloud Function deletes your Firestore user tree (vault, stats, study profiles, meta), leaderboard entry, username reservation, and Firebase Auth user, limited to your uid. Email ${LEGAL_CONTACT_EMAIL} for help. Depending on your region (e.g. KVKK / GDPR-style rights), you may request access, correction, deletion, restriction, or objection; we respond within the period required by applicable law.`
          : `Hizmette girişliyken profil alanlarını görüntüleyip güncelleyebilir ve kasanızı yönetebilirsiniz. Çıkış yapabilir; yerel depolamayı temizleyebilir; Google (veya Apple) girişini o sağlayıcının hesap ayarlarından iptal edebilir; Profil → Hesabı sil ile hesabı kalıcı silebilirsiniz — mobil uygulamalarda da aynı ürün kontrolü hedeflenir. Silme yakın zamanda yeniden doğrulama ister; ardından Cloud Function yalnızca sizin uid’nize ait Firestore kullanıcı ağacını (kasa, istatistik, profiller, meta), liderlik kaydını, kullanıcı adı rezervasyonunu ve Auth kullanıcısını siler. Yardım: ${LEGAL_CONTACT_EMAIL}. Bölgenize göre (KVKK / GDPR benzeri) erişim, düzeltme, silme, kısıtlama veya itiraz isteyebilirsiniz; yürürlükteki hukukun gerektirdiği sürede yanıtlarız.`,
      },
      {
        heading: en ? "10. Children" : "10. Çocuklar",
        body: en
          ? "The Service is general educational software and is not directed at children under 13 (or a higher age required where you live). We do not knowingly collect personal data from children below that age. We do not place the Service in store “Kids” categories. Parents/guardians who believe data was provided inappropriately should contact us for deletion."
          : "Hizmet genel eğitsel yazılımdır; 13 yaşın (veya yaşadığınız yerdeki daha yüksek yaşın) altındaki çocuklara yönelik değildir. Bu yaşın altında bilerek kişisel veri toplamayız. Hizmeti mağaza “Kids / Çocuk” kategorilerine yerleştirmeyiz. Uygunsuz veri verildiğini düşünen veli/vasiler silme için bize yazmalıdır.",
      },
      {
        heading: en ? "11. Security" : "11. Güvenlik",
        body: en
          ? "We use HTTPS, Firebase Authentication, Firestore security rules (private user data readable/writable by the owner; certain leaderboard-oriented stats may be publicly readable for rankings), App Check with reCAPTCHA Enterprise on web (and platform-appropriate App Check on mobile when configured), client abuse rate limits, and server-side account deletion bound to the authenticated uid after re-authentication. No method is 100% secure; we keep measures proportionate to a free learning service."
          : "HTTPS, Firebase Authentication, Firestore güvenlik kuralları (özel kullanıcı verisi sahibi tarafından; bazı liderlik odaklı istatistikler sıralama için herkese açık okunabilir), web’de reCAPTCHA Enterprise ile App Check (mobilde yapılandırıldığında platforma uygun App Check), istemci kötüye kullanım kotaları ve yeniden doğrulama sonrası kimliği doğrulanmış uid ile sınırlı sunucu tarafı hesap silme kullanırız. Hiçbir yöntem %100 güvenli değildir; önlemleri ücretsiz öğrenme hizmetine orantılı tutarız.",
      },
      {
        heading: en ? "12. Automated decision-making" : "12. Otomatik kararlar",
        body: en
          ? "We do not use solely automated profiling that produces legal or similarly significant effects (credit, employment, identity). Game difficulty, review scheduling, and abuse limits are product logic for learning and safety."
          : "Kredi, istihdam veya kimlik gibi hukuki / benzer önemli sonuç doğuran salt otomatik profilleme yapmayız. Oyun zorluğu, tekrar planlama ve kötüye kullanım limitleri öğrenme ve güvenlik için ürün mantığıdır.",
      },
      {
        heading: en ? "13. Store disclosures" : "13. Mağaza açıklamaları",
        body: en
          ? "When you install from Google Play or the Apple App Store, the store’s own privacy labels / Data safety forms summarize data types. Those forms are filled to match this Policy. If a store UI differs in wording, this Policy and in-product controls govern our practices. Permission prompts (e.g. microphone) will state the learning purpose."
          : "Google Play veya Apple App Store’dan yüklediğinizde mağazanın gizlilik etiketleri / Data safety formları veri türlerini özetler. Bu formlar bu Politikayla uyumlu doldurulur. Mağaza arayüzü farklı ifade kullanırsa, uygulamalarımızı bu Politika ve ürün içi kontroller belirler. İzin istemleri (ör. mikrofon) öğrenme amacını belirtir.",
      },
      {
        heading: en ? "14. Changes" : "14. Değişiklikler",
        body: en
          ? "We may update this Policy as the Service or laws change. We revise the “Last updated” date and, for material changes, take reasonable notice steps when practical (including on this page). Continued use after changes means acceptance unless mandatory law says otherwise."
          : "Hizmet veya hukuk değiştikçe bu Politikayı güncelleyebiliriz. “Son güncelleme” tarihini yenileriz; maddi değişikliklerde mümkün olduğunda makul bildirim adımları atarız (bu sayfa dâhil). Zorunlu hukuk aksini demedikçe, değişikliklerden sonra kullanıma devam kabul anlamına gelir.",
      },
      {
        heading: en ? "15. Contact & complaints" : "15. İletişim ve şikâyet",
        body: en
          ? `Privacy: ${LEGAL_CONTACT_EMAIL} · ${LEGAL_URLS.site}. You may lodge a complaint with your data-protection authority (in Türkiye, KVKK where applicable). We prefer you contact us first so we can fix issues quickly.`
          : `Gizlilik: ${LEGAL_CONTACT_EMAIL} · ${LEGAL_URLS.site}. Veri koruma otoritenize (Türkiye’de uygulanabilir olduğunda KVKK) şikâyet hakkınız saklıdır. Sorunları hızlı çözmek için önce bize yazmanızı tercih ederiz.`,
      },
    ],
  };
}
