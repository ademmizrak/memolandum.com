"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  Users,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Award,
  HeartHandshake,
  EyeOff,
  UserCheck,
  KeyRound,
  Laptop,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

const PILLARS = [
  {
    icon: UserCheck,
    badge: "Sıfır Evrak · Sıfır KVKK Stresi",
    title: "1. Gerçek İsim, Soyad veya Okul Adı Zorunluluğu Yok",
    accent: "cyan",
    description:
      "Sınıf açarken kendi gerçek adınızı veya okulunuzun resmi adını yazmak zorunda değilsiniz. İsterseniz sadece bir rumuz (Örn: \"İngilizce Öğretmeni\") ve bir avatar (🦉) seçerek 30 saniyede masanızı kurabilirsiniz.",
    bullets: [
      "Öğrencilerden T.C. kimlik, telefon, e-posta veya gerçek soyad kesinlikle istenmez.",
      "Öğrencilerinize \"Ahmet Y.\", \"Zeynep 4A\" gibi rumuzlar ve sevimli avatarlar (🦁, 🐼, 🚀) tanımlayabilirsiniz.",
      "Kişisel veri toplanmadığı için okul idaresinden veya velilerden bürokratik izin evrakları toplama yükünüz olmaz.",
    ],
  },
  {
    icon: EyeOff,
    badge: "Kapalı Zarf Sistemi",
    title: "2. Öğrenciler Birbirinin Notunu, İlerlemesini ve Adını Göremez",
    accent: "emerald",
    description:
      "Sınıfınızda akran zorbalığına veya kıyaslama stresine yer yoktur. Sınıfa katılan her öğrenci ekranda yalnızca kendi ödevini ve kendi çalışmasını görür.",
    bullets: [
      "Bir öğrenci sınıftaki diğer arkadaşlarının listesini, kimlerin sınıfta olduğunu veya kaç puan aldığını göremez.",
      "Bilgisayardan çok iyi anlayan meraklı öğrenciler tarayıcı ayarlarını karıştırsa bile arkadaşlarının bilgilerine ulaşamaz; çünkü sistemimiz diğer öğrencilerin verisini öğrencinin cihazına hiç göndermez.",
      "Her öğrencinin verisi yalnızca sizin öğretmen masanız ile o öğrencinin kendi ekranı arasında kapalı zarf gibi taşınır.",
    ],
  },
  {
    icon: Lock,
    badge: "Kilitli Öğretmen Çekmecesi",
    title: "3. Özel Gözlem Defteriniz ve Yazılı Notlarınız %100 Size Özeldir",
    accent: "purple",
    description:
      "Öğretmenler odasındaki kilitli çekmeceniz gibi düşünün: Öğrencileriniz hakkında aldığınız pedagojik notlar ve girdiğiniz sınav puanları yalnızca sizin ekranınızda yaşar.",
    bullets: [
      "\"Öğretmen Fikir Defteri\"ne yazdığınız gözlemleri (Örn: \"Derse katılımı arttı, çekim eklerinde desteklenmeli\") ne öğrenci ne de veli hiçbir şekilde göremez.",
      "Tabloya girdiğiniz 1. Yazılı, 2. Yazılı ve Sözlü/Quiz notları varsayılan olarak tamamen gizlidir; siz \"Öğrenciye Aç\" anahtarına basmadıkça kimseye gösterilmez.",
      "İstediğiniz an tek tıkla sınıfınızın PDF/yazıcı çıktısını alarak kendi fiziki dosyanıza ekleyebilirsiniz.",
    ],
  },
  {
    icon: KeyRound,
    badge: "Tam Öğretmen Otoritesi",
    title: "4. Hileye, Sahte Ödeve ve Sınıf Trollemesine Karşı Tam Koruma",
    accent: "amber",
    description:
      "Öğrencilerin sistemde kopya çekmesini, çalışmadan ödevi bitirmiş gibi göstermesini veya sınıf listesini bozmasını engelleyen akıllı koruma kalkanımız devrededir.",
    bullets: [
      "Öğrenci kelimeleri gerçekten çalışmadan \"ödevi %100 bitirdim\" hilesi yapamaz; sistem öğrencinin gerçek kelime kasasını kontrol eder.",
      "Öğrencinize siz bir rumuz veya avatar verdiğinizde bu bilgi mühürlenir; öğrenci kendi ekranından uygunsuz veya komik bir isim yazarak sizin listenizi değiştiremez.",
      "Sınıf mevcudunuz tamamlandığında \"🔒 Katılımı Kilitle\" tuşuna basarak sınıf kapısını kapatabilirsiniz; sınıf kodunuz dışarıda paylaşılsa bile yabancı kimse sınıfınıza giremez.",
    ],
  },
];

const WORKFLOW_MODES = [
  {
    emoji: "🏫",
    title: "Okul + Sınıf Modu",
    desc: "Devlet okulu veya kolejdeki şubeleriniz (Örn: 4-A, 7-C, 10-B) için. 1. sınıftan 12. sınıfa tüm MEB üniteleri hazırdır.",
  },
  {
    emoji: "👥",
    title: "Sadece Sınıf / Özel Ders Grubu",
    desc: "Hiçbir okul adı girmeden; hafta sonu kursunuz, LGS/YDS çalışma grubunuz veya birebir özel ders öğrencileriniz için.",
  },
  {
    emoji: "📋",
    title: "Cihazı Olmayan Öğrenciler İçin Manuel Liste",
    desc: "Evinde telefonu veya interneti olmayan öğrencilerinizi de \"Öğrenci Ekle\" butonuyla ekleyip tüm sınıfın notlarını tek tabloda tutabilirsiniz.",
  },
];

const FAQS = [
  {
    q: "Öğretmen olarak üye olurken veya sınıf açarken ücret ödeyecek miyim?",
    a: "Hayır. Öğretmen masası oluşturmak, sınıf açmak, ünite ödevi atamak, yazılı notu girmek ve özel gözlem defteri tutmak öğretmenlerimiz için tamamen ücretsizdir.",
  },
  {
    q: "Verilerim telefonumdan veya bilgisayarım kapandığında silinir mi?",
    a: "Hayır. Sınıf listeniz, girdiğiniz yazılı notları ve özel gözlem notlarınız güvenli bulut kasasında saklanır. Okuldaki akıllı tahtadan, evdeki bilgisayarınızdan veya cep telefonunuzdan girdiğinizde her şey bıraktığınız yerden devam eder.",
  },
  {
    q: "Öğrencilerim sınıfa nasıl katılıyor? Çok karmaşık mı?",
    a: "Sadece 5 saniye sürer. Sistem sınıfınız için akılda kalıcı 6 haneli bir sayısal PIN (Örn: 682419) üretir veya siz kendi özel kodunuzu (Örn: ATA4A) belirlersiniz. Öğrencileriniz bu kodu girip rumuz ve avatar seçerek anında sınıfa katılır.",
  },
  {
    q: "Okul müdürüm veya veliler güvenlik sorarsa ne söyleyebilirim?",
    a: "Memolandum'un öğrenci veya öğretmenden T.C. kimlik, soyad, telefon gibi hiçbir kişisel veri toplamadığını (Rumuz & Avatar sistemiyle çalıştığını), öğrencilerin birbirini göremediğini ve reklamsız/çocuk dostu güvenli altyapıya sahip olduğunu gönül rahatlığıyla paylaşabilirsiniz.",
  },
];

export default function TeacherTrustGuide({ onOpenDashboard }) {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* Üst Karşılama & Motivasyon Hero Kartı */}
      <div className="relative rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/25 to-slate-950 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Öğretmenlerimiz İçin Güvenlik, Mahremiyet ve Kullanım Rehberi</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Değerli Öğretmenimiz, Siz Sadece{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300">
              Öğretmenin Keyfine Odaklanın;
            </span>{" "}
            Güvenlik Bizim İşimiz.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Memolandum Öğretmen Masası, karmaşık teknik ayarlarla veya bürokratik izin evraklarıyla
            vaktinizi almamak için tasarlandı. Hem sizin hem de öğrencilerinizin bilgilerini{" "}
            <strong className="text-white">en üst düzey dijital güvenlik kalkanıyla</strong>{" "}
            korurken, derslerinizi öğrencilerinizin dört gözle beklediği bir deneyime dönüştürür.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all cursor-pointer"
            >
              <span>Hemen 30 Saniyede Sınıfımı Aç</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Temel Güvenlik Güvencesi (Teknik Terimsiz, Sade Anlatım) */}
      <div className="space-y-4">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">
            Neden Gönül Rahatlığıyla Kullanabilirsiniz?
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white mt-1">
            Sizi ve Öğrencilerinizi Koruyan 4 Altın Güvence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Teknik terimlerle boğulmadan, verilerinizin nasıl korunduğunu açık ve net olarak bilmenizi istiyoruz:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            const borderMap = {
              cyan: "border-cyan-500/30 hover:border-cyan-400/60",
              emerald: "border-emerald-500/30 hover:border-emerald-400/60",
              purple: "border-purple-500/30 hover:border-purple-400/60",
              amber: "border-amber-500/30 hover:border-amber-400/60",
            };
            const badgeMap = {
              cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
              emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
              purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
              amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
            };
            return (
              <div
                key={item.title}
                className={`p-6 sm:p-7 rounded-3xl bg-slate-900/90 border ${borderMap[item.accent]} shadow-xl flex flex-col justify-between space-y-4 transition-all`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${badgeMap[item.accent]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeMap[item.accent]}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white leading-snug">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <ul className="space-y-2 pt-3 border-t border-slate-800/80">
                  {item.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Her Öğretmene Uygun 3 Esnek Kullanım Modeli */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
            Sizi Tek Bir Kalıba Sokmuyoruz
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            İster Okulda, İster Özel Derste, İster Cihazsız Sınıfta Kullanın
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKFLOW_MODES.map((m) => (
            <div
              key={m.title}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
            >
              <div className="text-2xl">{m.emoji}</div>
              <h3 className="text-base font-bold text-white">{m.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Adımda Başlangıç Rehberi */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-indigo-950/30 p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Sadece 3 Adımda Nasıl Başlarsınız?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kurulum gerektirmez, teknik bilgi istemez — 1 dakikadan kısa sürer:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950/75 border border-slate-800 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              1. ADIM
            </span>
            <h3 className="text-sm font-bold text-white">Sınıfınızı veya Grubunuzu Açın</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              &ldquo;Yeni Sınıf / Okul Aç&rdquo; butonuna tıklayın. Sınıf seviyenizi (1–12. Sınıf, LGS veya YDS) ve görünmesini istediğiniz rumuz/avatarı seçin.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/75 border border-slate-800 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              2. ADIM
            </span>
            <h3 className="text-sm font-bold text-white">Öğrencilerinizi Ekleyin veya Kodu Paylaşın</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              İster 6 haneli sınıf kodunu WhatsApp&apos;tan paylaşın öğrencileriniz kendisi katılsın, ister &ldquo;Öğrenci Ekle&rdquo; butonuyla rumuz ve avatar seçerek siz ekleyin.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/75 border border-slate-800 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              3. ADIM
            </span>
            <h3 className="text-sm font-bold text-white">Ödev Atayın & Gelişimi İzleyin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Haftanın ünitesini tek tıkla ödev verin; kim kaç kelime öğrendi, doğruluk oranı kaç oldu, yazılı notları ve özel gözlemleriniz nedir tek ekrandan yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Sıkça Sorulan Sorular */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <span>Öğretmenlerimizin En Çok Merak Ettiği Sorular</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQS.map((item) => (
            <div
              key={item.q}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2"
            >
              <h3 className="text-sm font-bold text-cyan-300">{item.q}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alt Çağrı (CTA) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-white">
            Sınıfınızı Kurmaya Hazır mısınız?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Hiçbir resmi evrak veya gerçek kişisel bilgi girmeden, 30 saniye içinde ilk sınıf masanızı oluşturun.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenDashboard}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all whitespace-nowrap cursor-pointer"
        >
          <span>Öğretmen Paneline Geç</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
