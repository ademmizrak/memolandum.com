import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_URLS,
} from "./config";

/**
 * Nihai Kullanım Koşulları — tek metin: web + Android/iOS.
 * Apple özel EULA zorunlu maddeleri + Play ile uyumlu; ayrı app ToS yok.
 */
export function getTermsDoc(locale = "tr") {
  const en = locale === "en";
  return {
    title: en ? "Terms of Service" : "Kullanım Koşulları",
    lastUpdated: LEGAL_LAST_UPDATED,
    intro: en
      ? "Welcome to Memolandum. These Terms of Service (“Terms”) are a single agreement for the entire Memolandum Service: memolandum.com, progressive web use, and Memolandum apps on Android and iOS when published (the “Service”). We do not publish a separate “app-only” terms document. By using the Service you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service."
      : "Memolandum’a hoş geldiniz. Bu Kullanım Koşulları (“Koşullar”), Memolandum Hizmetinin tamamı için tek anlaşmadır: memolandum.com, progressive web kullanım ve yayımlandığında Android / iOS Memolandum uygulamaları (“Hizmet”). Ayrı bir “yalnızca uygulama” koşullar belgesi yayımlamayız. Hizmeti kullanarak bu Koşulları ve Gizlilik Politikamızı kabul etmiş olursunuz. Kabul etmiyorsanız Hizmeti kullanmayın.",
    sections: [
      {
        heading: en ? "1. One Service, quality commitment" : "1. Tek Hizmet, kalite taahhüdü",
        body: en
          ? "Memolandum is operated as a real product — not a disposable experiment. We invest in games, language pathways, translation helpers, and study tools. The Service is free / best-effort: features may evolve, pause for maintenance, or be refined. We will not casually abandon usefulness or user experience, but we do not promise uninterrupted uptime, specific exam results, or perfect AI output."
          : "Memolandum, geçici bir heves değil; gerçek bir ürün olarak işletilir. Oyunlara, dil yollarına, çeviri yardımcılarına ve çalışma araçlarına yatırım yaparız. Hizmet ücretsiz / makul çaba (“best effort”) esasıyla sunulur: özellikler gelişebilir, bakım için durabilir veya sadeleştirilebilir. Kullanışlılık ve kullanıcı deneyimini hafife almayız; ancak kesintisiz çalışma, belirli sınav sonucu veya kusursuz YZ çıktısı garanti etmeyiz.",
      },
      {
        heading: en ? "2. What the Service includes" : "2. Hizmetin kapsamı",
        body: en
          ? "Educational vocabulary practice through arcade-style games on static word databases remains free. Optional AI-assisted translation (including microphone input) includes a limited free trial; continued AI translation is a paid Premium feature because of third-party API costs. Also included: personal word vault, multi-language study profiles, leaderboards. Guest play offers limited sync; a free account enables cloud sync. Premium is billed via PCI-compliant hosted checkout (Shopier in Türkiye, Stripe internationally) — we never ask you to type card data into Memolandum forms."
          : "Statik kelime veritabanı üzerindeki arcade oyunlarla eğitsel kelime pratiği bedava kalır. İsteğe bağlı YZ çeviri (mikrofon dâhil) sınırlı ücretsiz deneme içerir; süregelen AI çeviri, üçüncü taraf API maliyeti nedeniyle ücretli Premium’dır. Ayrıca: kişisel kelime kasası, çoklu dil çalışma profilleri, liderlik. Misafir sınırlı senkron; ücretsiz hesap bulut senkronu. Premium, PCI uyumlu barındırılan ödeme ile tahsil edilir (Türkiye’de Shopier, uluslararası Stripe) — kart verisini Memolandum formlarına yazmanızı istemeyiz.",
      },
      {
        heading: en ? "3. License to use (web & apps)" : "3. Kullanım lisansı (web ve uygulamalar)",
        body: en
          ? "Subject to these Terms, we grant you a personal, non-exclusive, non-transferable, revocable license to use the Service for your own language-learning purposes. You may not copy, modify, distribute, sell, lease, reverse-engineer (except to the extent mandatory law allows), or create derivative works of our software or branding. On mobile, the app is also subject to the standard terms of the Apple App Store or Google Play from which you downloaded it; if those store rules conflict with these Terms on a mandatory point, the store’s mandatory rule prevails for that download channel only."
          : "Bu Koşullara bağlı olarak, Hizmeti kendi dil öğrenme amaçlarınız için kişisel, münhasır olmayan, devredilemez, geri alınabilir bir lisansla kullanma hakkı veririz. Yazılımımızı veya markamızı kopyalayamaz, değiştiremez, dağıtamaz, satamaz, kiraya veremez, (zorunlu hukukun izin verdiği dışında) tersine mühendislik yapamaz veya türev eser oluşturamazsınız. Mobilde uygulama, indirdiğiniz Apple App Store veya Google Play’in standart şartlarına da tabidir; zorunlu bir noktada mağaza kuralı bu Koşullarla çelişirse, yalnızca o indirme kanalı için mağazanın zorunlu kuralı önceliklidir.",
      },
      {
        heading: en ? "4. Eligibility & accounts" : "4. Uygunluk ve hesaplar",
        body: en
          ? "You must be able to form a binding agreement. If you are under the age of digital consent where you live (often 13+), use the Service only with parent/guardian involvement as required by law. Keep credentials confidential and notify " +
            LEGAL_CONTACT_EMAIL +
            " of suspected unauthorized access. You are responsible for activity under your account unless it results from our proven security failure. We may refuse, suspend, or terminate accounts that create abuse, fraud, legal, or security risk (including disabling Authentication and/or deleting data under the Privacy Policy). When practical we prefer warnings first; serious or repeated abuse may lead to immediate action. Platform rules may require offering Sign in with Apple alongside Google Sign-In on iOS — when enabled, Apple’s terms for that button also apply to that sign-in method."
          : "Bağlayıcı sözleşme kurabilecek durumda olmalısınız. Yaşadığınız yerdeki dijital rıza yaşının altındaysanız (çoğu yerde 13+), yasaların gerektirdiği veli/vasi gözetiminde kullanın. Kimlik bilgilerinizi gizli tutun; yetkisiz erişim şüphesinde " +
            LEGAL_CONTACT_EMAIL +
            " adresine yazın. Kanıtlanmış güvenlik açığımızdan kaynaklanmadığı sürece hesabınızdaki etkinliklerden siz sorumlusunuz. Kötüye kullanım, dolandırıcılık, hukuki veya güvenlik riski oluşturan hesapları reddedebilir, askıya alabilir veya sonlandırabiliriz (Authentication’ı kapatmak ve/veya Gizlilik Politikası uyarınca veri silmek dâhil). Mümkün olduğunda önce uyarı; ağır veya tekrarlayan ihlalde anında işlem. Platform kuralları iOS’ta Google ile giriş yanında Sign in with Apple sunmayı gerektirebilir — etkinse bu giriş yöntemi için Apple’ın ilgili şartları da uygulanır.",
      },
      {
        heading: en ? "5. Acceptable use" : "5. Kabul edilebilir kullanım",
        body: en
          ? "To protect quality for every learner, you agree not to: disrupt, overload, scrape, or attack the Service; abuse AI translation (spam, malware, illegal content, sexual content involving minors, harvesting others’ personal data); bypass rate limits, App Check, or security controls; manipulate leaderboards, XP, gems, or scores via automation, exploits, or fake clients in a way that harms fairness; impersonate others; or use the Service unlawfully. We may enforce this with technical measures and operator actions. Fair play keeps Memolandum fun."
          : "Her öğrenen için kaliteyi korumak adına: Hizmeti bozmamayı, aşırı yüklememeyi, izinsiz kazımamayı veya saldırmamayı; YZ çeviriyi kötüye kullanmamayı (spam, zararlı yazılım, yasa dışı içerik, çocuklara yönelik cinsel içerik, başkalarının verisini toplama); kota, App Check veya güvenliği aşmamayı; otomasyon / açık / sahte istemci ile liderlik veya XP’yi adaleti bozacak şekilde manipüle etmemeyi; kimliğe bürünmemeyi; yasa dışı kullanmamayı kabul edersiniz. Teknik önlemler ve operatör aksiyonlarıyla uygulayabiliriz. Adil oyun Memolandum’u eğlenceli tutar.",
      },
      {
        heading: en ? "6. AI translation & learning content" : "6. YZ çeviri ve öğrenme içeriği",
        body: en
          ? "Instant translation is a learning aid via third-party AI (Google Gemini through Firebase AI Logic). Outputs may be wrong or incomplete. Do not rely on them as sole authority for exams or medical, legal, or safety-critical decisions. Do not submit sensitive data you are unwilling to process through Google. Vocabulary datasets aim for useful diversity; they are not warranted error-free. If something looks wrong, tell us — we improve continuously."
          : "Anlık çeviri, üçüncü taraf YZ (Firebase AI Logic üzerinden Google Gemini) ile öğrenme yardımcısıdır. Çıktılar hatalı veya eksik olabilir. Sınav veya tıbbi / hukuki / güvenlik kritik kararlarda tek kaynak saymayın. Google üzerinden işlenmesini istemediğiniz hassas verileri göndermeyin. Kelime veri setleri yararlı çeşitlilik hedefler; hatasız oldukları garanti edilmez. Yanlış görünen bir şey varsa yazın — sürekli iyileştiririz.",
      },
      {
        heading: en ? "7. Intellectual property & feedback" : "7. Fikri mülkiyet ve geri bildirim",
        body: en
          ? "Memolandum name, logos, design, game shells, and original software are owned by Memolandum or its licensors. Third-party marks and vocabulary sources remain with their owners. You retain rights in content you create; you grant us a worldwide, non-exclusive, royalty-free license to host and process it solely to operate and improve the Service. Feedback you send may be used without compensation unless we agree otherwise in writing."
          : "Memolandum adı, logoları, tasarımı, oyun kabukları ve özgün yazılım Memolandum’a veya lisans verenlerine aittir. Üçüncü taraf markalar ve kelime kaynakları sahiplerinde kalır. Oluşturduğunuz içerikteki haklarınız sizde kalır; Hizmeti işletmek ve iyileştirmek için barındırma ve işleme konusunda bize dünya çapında, münhasır olmayan, telifsiz lisans verirsiniz. Gönderdiğiniz geri bildirim, yazılı aksi kararlaşmadıkça bedelsiz kullanılabilir.",
      },
      {
        heading: en ? "8. Leaderboards & virtual items" : "8. Liderlik ve sanal öğeler",
        body: en
          ? "XP, gems, scores, ranks, and similar items have no cash value and are not redeemable for money unless we expressly run a lawful promotion. We may correct or reset values to fix bugs, abuse, or integrity issues — to protect fairness for honest players, not to punish them arbitrarily."
          : "XP, gem, skor, sıra ve benzeri öğelerin nakit değeri yoktur; açık yasal kampanya olmadıkça paraya çevrilemez. Hata, kötüye kullanım veya bütünlük için değerleri düzeltebilir veya sıfırlayabiliriz — amaç dürüst oyuncular için adalet, keyfi ceza değil.",
      },
      {
        heading: en ? "9. Updates, stores & third parties" : "9. Güncellemeler, mağazalar ve üçüncü taraflar",
        body: en
          ? "We may push updates to the website and apps (including via App Store / Play). Updates may be required for continued use or security. The Service depends on Google Firebase, Google Sign-In, Gemini, analytics/hosting, and (on iOS when enabled) Apple sign-in; their outages may affect availability. Links to third-party sites (support, donations, etc.) are outside our control."
          : "Web sitesine ve uygulamalara (App Store / Play dâhil) güncelleme gönderebiliriz. Güncellemeler güvenlik veya kullanıma devam için gerekebilir. Hizmet Google Firebase, Google Sign-In, Gemini, analitik/barındırma ve (iOS’ta etkinse) Apple girişine dayanır; kesintileri erişimi etkileyebilir. Üçüncü taraf bağlantıları (destek, bağış vb.) kontrolümüz dışındadır.",
      },
      {
        heading: en
          ? "10. Apple App Store — required acknowledgments"
          : "10. Apple App Store — zorunlu kabul beyanları",
        body: en
          ? "If you obtained a Memolandum iOS app from Apple’s App Store: (a) these Terms are between you and Memolandum only, not Apple; (b) Memolandum — not Apple — is solely responsible for the app and its content; (c) Apple has no obligation to furnish maintenance or support for the app; (d) to the maximum extent permitted by law, Apple has no warranty obligation for the app (for paid apps, Apple’s standard refund rules for failed warranties may apply as between you and Apple); (e) Memolandum — not Apple — is responsible for addressing claims relating to the app (product liability, legal/regulatory compliance, consumer protection, privacy, or IP infringement); (f) if a third party claims the app infringes their IP, Memolandum — not Apple — is responsible for investigation, defense, settlement, and discharge as required; (g) you represent you are not in a country subject to US embargo or on a US government prohibited-party list, and will comply with applicable export rules; (h) Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you regarding the iOS app. Questions: " +
            LEGAL_CONTACT_EMAIL +
            "."
          : "Memolandum iOS uygulamasını Apple App Store’dan edindiyseniz: (a) bu Koşullar yalnızca sizinle Memolandum arasındadır, Apple taraf değildir; (b) uygulamadan ve içeriğinden yalnızca Memolandum — Apple değil — sorumludur; (c) Apple’ın uygulama için bakım veya destek sağlama yükümlülüğü yoktur; (d) yasaların izin verdiği ölçüde Apple’ın uygulama için garanti yükümlülüğü yoktur (ücretli uygulamalarda başarısız garanti için Apple’ın standart iade kuralları sizinle Apple arasında uygulanabilir); (e) uygulamayla ilgili taleplerden (ürün sorumluluğu, hukuki/düzenleyici uyum, tüketici koruması, gizlilik veya fikri mülkiyet ihlali) Memolandum — Apple değil — sorumludur; (f) üçüncü kişi uygulamanın fikri mülkiyetini ihlal ettiğini iddia ederse, soruşturma, savunma, sulh ve ibra Memolandum’un — Apple’ın değil — sorumluluğundadır; (g) ABD ambargosuna tabi bir ülkede bulunmadığınızı veya ABD hükümetinin yasaklı taraflar listesinde olmadığınızı beyan eder, uygulanabilir ihracat kurallarına uyarsınız; (h) Apple ve iştirakleri bu Koşulların üçüncü taraf lehtarlarıdır ve iOS uygulaması bakımından bunları size karşı ileri sürebilir. Sorular: " +
            LEGAL_CONTACT_EMAIL +
            ".",
      },
      {
        heading: en ? "11. Google Play" : "11. Google Play",
        body: en
          ? "If you obtained a Memolandum Android app from Google Play, your use is also subject to Google Play’s terms. Google is not a party to these Terms between you and Memolandum. Memolandum is responsible for the app’s content, privacy practices, and support unless Google’s terms mandatorily say otherwise for a specific Play feature."
          : "Memolandum Android uygulamasını Google Play’den edindiyseniz kullanımınız Google Play şartlarına da tabidir. Google, sizinle Memolandum arasındaki bu Koşulların tarafı değildir. Belirli bir Play özelliği için Google şartları zorunlu olarak aksi demedikçe; içeriğin, gizlilik uygulamalarının ve desteğin sorumlusu Memolandum’dur.",
      },
      {
        heading: en
          ? "12. Disclaimers (as is / as available)"
          : "12. Sorumluluk reddi (olduğu gibi / mevcut hâliyle)",
        body: en
          ? "TO THE MAXIMUM EXTENT PERMITTED BY LAW, the Service is provided “AS IS” and “AS AVAILABLE,” without warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant uninterrupted, secure, or error-free operation, or that translations or vocabulary data will meet your expectations. Nothing here limits rights that cannot be limited under mandatory consumer law (including in Türkiye)."
          : "YASALARIN İZİN VERDİĞİ AZAMİ ÖLÇÜDE Hizmet “OLDUĞU GİBİ” ve “MEVCUT OLDUĞU ŞEKLİYLE” sunulur; satılabilirlik, belirli amaca uygunluk veya ihlal etmeme garantisi verilmez. Kesintisiz, güvenli veya hatasız çalışma; çevirilerin veya kelime verisinin beklentinizi karşılaması garanti edilmez. Buradaki hiçbir şey, zorunlu tüketici hukukunun (Türkiye dâhil) sınırlanamayacak haklarını sınırlamayı amaçlamaz.",
      },
      {
        heading: en ? "13. Limitation of liability" : "13. Sorumluluk sınırı",
        body: en
          ? "TO THE MAXIMUM EXTENT PERMITTED BY LAW, Memolandum and its operators are not liable for indirect, incidental, special, consequential, punitive, or exemplary damages, or loss of profits, data, goodwill, or exam/career outcomes from your use of the Service. Aggregate liability for claims relating to the Service in any twelve-month period is limited to the greater of (a) fees you paid us for the Service in that period (typically zero for the free Service) or (b) one hundred Turkish Lira (TRY 100), except where liability cannot be limited (e.g. proven willful misconduct or mandatory rules)."
          : "YASALARIN İZİN VERDİĞİ AZAMİ ÖLÇÜDE Memolandum ve işletenleri; dolaylı, arızi, özel, sonuçsal, cezai veya örnek zararlardan; kâr, veri, itibar veya sınav/kariyer sonuç kaybından sorumlu tutulamaz. On iki aylık dönemde Hizmete ilişkin toplam sorumluluk, (a) o dönemde ödediğiniz ücret (ücretsiz Hizmette genellikle sıfır) veya (b) 100 TRY tutarından büyük olanıyla sınırlıdır — sorumluluğun sınırlanamayacağı hâller saklıdır.",
      },
      {
        heading: en ? "14. Harmful misuse" : "14. Zararlı kötüye kullanım",
        body: en
          ? "If you misuse the Service in a way that causes demonstrable harm (illegal AI content, attacks on systems, etc.), you agree to cooperate reasonably to mitigate harm and, to the extent permitted by law, to cover losses and reasonable costs we incur from your unlawful misuse — without prejudice to mandatory rules that prohibit unfair indemnity against consumers."
          : "Hizmeti kanıtlanabilir zarar verecek şekilde kötüye kullanırsanız (yasa dışı YZ içeriği, sistemlere saldırı vb.), zararı azaltmak için makul işbirliği yapmayı ve yasaların izin verdiği ölçüde hukuka aykırı kötüye kullanımınızdan doğan zarar ve makul masrafları karşılamayı kabul edersiniz — tüketicilere karşı haksız tazmin yasağı getiren zorunlu kurallar saklıdır.",
      },
      {
        heading: en ? "15. Suspension, termination & deletion" : "15. Askıya alma, fesih ve silme",
        body: en
          ? "You may stop anytime, sign out from Profile, or permanently delete your account via Profile → Delete account (Privacy Policy). We may change, suspend, or discontinue features when needed for security, law, or sustainability of a free service. Surviving clauses remain in effect. Ending a free feature does not create a fee obligation for you."
          : "İstediğiniz zaman bırakabilir, Profil’den çıkış yapabilir veya Profil → Hesabı sil ile hesabı kalıcı silebilirsiniz (Gizlilik Politikası). Güvenlik, hukuk veya ücretsiz hizmetin sürdürülebilirliği için özellikleri değiştirebilir, askıya alabilir veya sonlandırabiliriz. Ayakta kalan maddeler geçerlidir. Ücretsiz bir özelliği sonlandırmak size ücret borcu doğurmaz.",
      },
      {
        heading: en ? "16. Privacy" : "16. Gizlilik",
        body: en
          ? "Personal data is handled under " +
            LEGAL_URLS.privacy +
            " — the same Policy for web and apps. Use of the Service means you understand those practices."
          : "Kişisel veriler " +
            LEGAL_URLS.privacy +
            " kapsamında işlenir — web ve uygulamalar için aynı Politika. Hizmeti kullanmak bu uygulamaları anladığınız anlamına gelir.",
      },
      {
        heading: en ? "17. Changes" : "17. Değişiklikler",
        body: en
          ? "We may update these Terms as the product and law evolve. We change the “Last updated” date and, for material changes, take reasonable notice steps when practical. Continued use after the effective date is acceptance where allowed by law. If you disagree, stop using the Service and delete your account."
          : "Ürün ve hukuk geliştikçe bu Koşulları güncelleyebiliriz. “Son güncelleme” tarihini değiştiririz; maddi değişikliklerde mümkün olduğunda makul bildirim yaparız. Yürürlükten sonra kullanıma devam, yasaların izin verdiği ölçüde kabul sayılır. Katılmıyorsanız Hizmeti bırakın ve hesabınızı silin.",
      },
      {
        heading: en ? "18. Governing law & disputes" : "18. Uygulanacak hukuk ve uyuşmazlıklar",
        body: en
          ? "Governed by the laws of the Republic of Türkiye, except that mandatory consumer protections where you live remain available. Try first to resolve disputes in good faith via " +
            LEGAL_CONTACT_EMAIL +
            ". If unresolved, courts of Türkiye have jurisdiction, without limiting mandatory rights to use local consumer venues where applicable. Store-mediated refund or review processes (Apple/Google) may apply in parallel under store rules and do not replace these Terms between you and Memolandum."
          : "İkametinizdeki zorunlu tüketici korumaları saklı kalmak kaydıyla Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlığı önce " +
            LEGAL_CONTACT_EMAIL +
            " ile iyi niyetle çözmeye çalışın. Çözülemezse Türkiye mahkemeleri yetkilidir — uygulanabilir yerel tüketici mercilerine zorunlu haklarınız saklıdır. Mağaza aracılı iade veya inceleme süreçleri (Apple/Google) mağaza kurallarına göre paralel işleyebilir; sizinle Memolandum arasındaki bu Koşulların yerini almaz.",
      },
      {
        heading: en ? "19. General" : "19. Genel hükümler",
        body: en
          ? "If a provision is unenforceable, the rest remains. Failure to enforce is not a waiver. You may not assign these Terms without our consent; we may assign them in a reorganization or asset transfer. These Terms, the Privacy Policy, and feature notices we publish are the entire agreement regarding the Service and supersede prior informal statements (including social posts), except for fraud. Force majeure: we are not liable for delays beyond reasonable control (provider outages, war, epidemic, infrastructure failure, store policy changes)."
          : "Bir hüküm uygulanamazsa kalanı yürürlükte kalır. Uygulamamak feragat sayılmaz. Onayımız olmadan devredemezsiniz; biz yeniden yapılanma veya varlık devrinde devredebiliriz. Bu Koşullar, Gizlilik Politikası ve yayımladığımız özellik bildirimleri Hizmete ilişkin bütün anlaşmayı oluşturur; hile saklı kalmak kaydıyla önceki gayriresmî beyanların (sosyal medya dâhil) yerini alır. Mücbir sebep: makul kontrolümüz dışındaki gecikmelerden (sağlayıcı kesintisi, savaş, salgın, altyapı, mağaza politika değişikliği) sorumlu değiliz.",
      },
      {
        heading: en ? "20. Contact" : "20. İletişim",
        body: en
          ? `Questions: ${LEGAL_CONTACT_EMAIL} · Terms: ${LEGAL_URLS.terms} · Privacy: ${LEGAL_URLS.privacy} · We read messages — feedback helps us keep Memolandum both robust and joyful.`
          : `Sorular: ${LEGAL_CONTACT_EMAIL} · Koşullar: ${LEGAL_URLS.terms} · Gizlilik: ${LEGAL_URLS.privacy} · Mesajları okuruz — geri bildirim Memolandum’u hem sağlam hem keyifli tutar.`,
      },
    ],
  };
}
