"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  Heart,
  Sparkles,
  CheckCircle2,
  BookOpen,
  MessageCircle,
  Volume2,
  Users,
  ArrowRight,
  HelpCircle,
  Lock,
  Smile,
  Clock,
  Share2,
} from "lucide-react";
import ParentReportModal from "./ParentReportModal";
import { calculateParentReportData } from "../../lib/reports/reportGenerator";
import { useMemolandumStore } from "../../store/useMemolandumStore";

const PARENT_FEATURES = [
  {
    icon: Award,
    badge: "Tahmin Değil, Gerçek Sonuç",
    title: "1. Çocuğunuzun Neler Öğrendiğini Gösteren Başarı Karnesi",
    accent: "amber",
    description:
      "Çocuğunuzun sadece \"bilgisayarda vakit geçirdiğini\" değil; gerçekte kaç kelimeyi kalıcı olarak öğrendiğini, doğruluk oranını ve bu hafta kaç gün çalıştığını tek ekranda görürsünüz.",
    bullets: [
      "Karnenin üzerinde çocuğunuzun öğrendiği kelimeleri ve Türkçe anlamlarını tek tek görebilirsiniz.",
      "Kelimelerin yanındaki hoparlör (🔊) tuşuna basarak doğru okunuşlarını çocuğunuzla birlikte dinleyebilirsiniz.",
      "Karneyi tek tuşla telefonunuza resim olarak indirebilir veya eşinizle, aile büyükleriyle ve öğretmeniyle WhatsApp'tan paylaşabilirsiniz.",
    ],
  },
  {
    icon: Volume2,
    badge: "İngilizce Bilmenize Gerek Yok",
    title: '2. Akşam Yemeğinde Oynayabileceğiniz "3 Kelime" Aile Oyunu',
    accent: "emerald",
    description:
      "\"Ben İngilizce bilmiyorum, çocuğuma nasıl yardımcı olabilirim?\" diye hiç endişelenmeyin. Sistem size her gün çocuğunuza sorabileceğiniz 3 kelimeyi hazır olarak sunar.",
    bullets: [
      "Karnedeki \"Evde 3 Kelime & Mesaj\" sekmesini açtığınızda kelimenin İngilizcesi, Türkçe anlamı ve Türkçe okunuşu (Örn: Apple → \"ep-ıl\" → Elma) ekranda yazar.",
      "İsterseniz \"Dinle\" tuşuna basıp kelimenin sesini doğrudan telefona okutabilirsiniz.",
      "Çocuğunuz bildikçe \"Bildi!\" tuşuna basarak 1 dakikada eğlenceli ve sevgi dolu bir aile sohbeti başlatırsınız.",
    ],
  },
  {
    icon: Heart,
    badge: "Ödev Baskısı Yerine Takdir",
    title: "3. Tek Tuşla Hazır Gurur ve Motivasyon Mesajları",
    accent: "cyan",
    description:
      "Çocuklara \"Ders çalıştın mı?\" diye sormak yerine çabalarını takdir etmek, öğrenme isteğini katbekat artırır.",
    bullets: [
      "Karnenin içinden çocuğunuzun adına ve öğrendiği kelime sayısına özel hazırlanmış \"Gurur Mesajı\"nı tek tuşla WhatsApp'tan gönderebilirsiniz.",
      "\"Akşam 3 kelime yarışması yapalım mı?\" mesajıyla çocuğunuzu korkutmadan, oyun diliyle çalışmaya davet edebilirsiniz.",
      "Aile WhatsApp grubunuz için hazır başarı özetini tek dokunuşla paylaşabilirsiniz.",
    ],
  },
  {
    icon: BookOpen,
    badge: "Unutmaya Karşı Akıllı Takip",
    title: "4. Hata Defteri: Zorlandığı Kelimeler Asla Kaybolmaz",
    accent: "purple",
    description:
      "Çocuğunuz oyun oynarken bir kelimeyi yanlış yaparsa veya karıştırırsa, sistem o kelimeyi kızmadan \"Hata Defteri\"ne not alır.",
    bullets: [
      "Okul yazılısı öncesinde tüm kitabı baştan sona ezberletmek yerine, sadece çocuğunuzun takıldığı kelimeleri çalıştırabilirsiniz.",
      "Sistem, çocuğunuzun öğrendiği kelimeleri tam unutacağı günlerde oyun içinde tekrar karşısına çıkararak kalıcı hafızaya yerleştirir.",
      "1. sınıftan 8. sınıfa (LGS dahil), lise ve YDS'ye kadar tüm okul üniteleri sınıf sınıf hazırdır.",
    ],
  },
];

const SAFETY_PROMISES = [
  {
    emoji: "🛡️",
    title: "%100 Reklamsız ve Çocuk Güvenli",
    desc: "Oyun ortasında uygunsuz reklamlar, alışveriş tuzakları veya yabancı kişilerle sohbet pencereleri kesinlikle yoktur.",
  },
  {
    emoji: "🆓",
    title: "Okul Müfredatı ve Oyunlar Ücretsiz",
    desc: "1–8. sınıf okul üniteleri, sesli cümleler ve 8 eğitici oyun ücretsizdir; başlamak için kredi kartı bilgisi istenmez.",
  },
  {
    emoji: "🔒",
    title: "Gerçek Soyad veya TC Kimlik İstenmez",
    desc: "Çocuğunuzun gerçek soyadını veya telefonunu yazmanıza gerek yoktur; sadece sevdiği bir isim veya rumuz yeterlidir.",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Kardeşler İçin Ayrı Profil İmkanı",
    desc: "Evde birden fazla çocuğunuz varsa aynı telefondan her kardeş için ayrı sınıf profili açıp karnelerini ayrı ayrı izleyebilirsiniz.",
  },
];

const PARENT_FAQS = [
  {
    q: "Üye olurken veya çocuğum oyun oynarken ücret ödeyecek miyim?",
    a: "Hayır. Tüm okul müfredatı kelimeleri (1. sınıftan 12. sınıfa, LGS ve YDS dahil), sesli cümleler, 8 eğitici oyun ve Veli Karnesi tamamen ücretsizdir. Kredi kartı bilgisi girmeniz gerekmez.",
  },
  {
    q: "Ben hiç İngilizce bilmiyorum, yine de çocuğuma destek olabilir miyim?",
    a: "Kesinlikle evet! Veli Karnesi'ni tam da bunun için tasarladık. \"Evde 3 Kelime & Mesaj\" sekmesinde kelimelerin Türkçe okunuşları yazar ve hoparlör tuşu kelimeyi sesli okur. Siz sadece çocuğunuza sorup onu alkışlarsınız.",
  },
  {
    q: "Çocuğum günde kaç dakika kullanmalı? Ekranda çok kalır mı?",
    a: "Bilimsel araştırmalara göre günde sadece 10–15 dakikalık düzenli pratik, haftada bir gün saatlerce çalışmaktan çok daha etkilidir. Günlük hedef çubuğu dolduğunda çocuğunuz o günkü görevini tamamlamış olur.",
  },
  {
    q: "İki çocuğum var, aynı telefondan veya bilgisayardan kullanabilirler mi?",
    a: "Evet. Veli Karnesi veya Profil sayfasındaki \"Yeni Çocuk\" butonuna basarak her çocuğunuz için kendi adını ve kendi sınıfını (Örn: biri 2. Sınıf, diğeri 6. Sınıf) ekleyebilir, tek tıkla aralarında geçiş yapabilirsiniz.",
  },
  {
    q: "Okuldaki İngilizce öğretmeni 6 haneli bir sınıf kodu verdiyse ne yapmalıyız?",
    a: "Profil sayfasındaki \"Sınıf Kodunu Gir\" butonuna öğretmeninizin verdiği 6 haneli kodu yazmanız yeterlidir. Öğretmenin verdiği haftalık ünite ödevi çocuğunuzun ekranında otomatik olarak açılır.",
  },
  {
    q: "Okul kitabımızdaki bir üniteyi ekletmek veya size görüş bildirmek istersem nasıl ulaşırım?",
    a: "Veli Karnesi içindeki \"Aile Kulübü & İletişim\" sekmesinden doğrudan bize mesaj gönderebilirsiniz. Pedagoji ekibimiz velilerimizden gelen okul ünite taleplerini hızla sisteme eklemektedir.",
  },
];

export default function ParentGuide({ onOpenReportModal }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("report");

  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];
  const globalStats = useMemolandumStore((s) => s.globalStats);
  const profile = useMemolandumStore((s) => s.profile);
  const activeStudyProfile = useMemolandumStore((s) => s.getActiveStudyProfile?.() || null);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);
  const childrenProfiles = useMemolandumStore((s) => s.childrenProfiles) || [];
  const activeChildId = useMemolandumStore((s) => s.activeChildId);
  const joinedClassroom = useMemolandumStore((s) => s.joinedClassroom);

  const reportData = React.useMemo(() => {
    const selectedChild =
      childrenProfiles.find((c) => c.id === activeChildId) ||
      childrenProfiles[0] ||
      null;
    return calculateParentReportData({
      vocabularyVault,
      quizHistory,
      globalStats,
      profile,
      activeStudyProfile,
      lastPlayedLevel: selectedChild?.grade || lastPlayedLevel || "meb-2-sinif-kelimeleri",
      selectedChild,
      joinedClassroom,
    });
  }, [
    vocabularyVault,
    quizHistory,
    globalStats,
    profile,
    activeStudyProfile,
    lastPlayedLevel,
    childrenProfiles,
    activeChildId,
    joinedClassroom,
  ]);

  const handleOpenModal = (tab = "report") => {
    if (onOpenReportModal) {
      onOpenReportModal(tab);
      return;
    }
    setModalTab(tab);
    setModalOpen(true);
  };

  const handleShareGuideWhatsApp = () => {
    const text = `👨‍👩‍👧 *Veliler İçin Harika Bir İngilizce Takip & Oyun Rehberi!* 🎓\n\nÇocuklar reklamsız ve ücretsiz oyunlarla okul müfredat kelimelerini öğreniyor; biz veliler de İngilizce bilmesek bile *Veli Karnesi* ve *Evde 3 Kelime Oyunu* ile gelişimlerini takip edebiliyoruz.\n\n1 dakikalık basit Veli Rehberi: https://memolandum.com/veli-rehberi`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* Üst Karşılama & Motivasyon Hero Kartı */}
      <div className="relative rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-950 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Smile className="w-4 h-4 text-amber-400" />
            <span>Velilerimiz İçin 1 Dakikalık Basit Kullanım ve Güven Rehberi</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            İngilizce Bilmeseniz Bile,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300">
              Çocuğunuzun En Büyük Destekçisi
            </span>{" "}
            Olabilirsiniz.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Memolandum; sıkıcı ödev kavgalarına, oyun ortasında çıkan reklamlara ve pahalı kurs masraflarına
            son vermek için hazırlandı. Çocuğunuz okul kelimelerini eğlenerek öğrenirken, siz de{" "}
            <strong className="text-white">hiçbir teknik bilgiye ihtiyaç duymadan</strong>{" "}
            onun başarısını takip edebilir ve birlikte gurur duyabilirsiniz.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenModal("report")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:scale-105 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>🎓 Veli Karnesini Şimdi Aç</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal("bond")}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-bold text-sm transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>🍽️ Evde &ldquo;3 Kelime&rdquo; Oyununu Dene</span>
            </button>

            <button
              type="button"
              onClick={handleShareGuideWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>Veli WhatsApp Grubunda Paylaş</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Temel Veli Özelliği (Çok Basit, Samimi Anlatım) */}
      <div className="space-y-4">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
            Veli Karnesi Ne İşe Yarar?
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white mt-1">
            Çocuğunuzla Bağınzı Güçlendiren 4 Kolay Özellik
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Karmaşık grafikler veya yabancı terimler yok; her şey bir bakışta anlaşılır:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {PARENT_FEATURES.map((item) => {
            const Icon = item.icon;
            const borderMap = {
              amber: "border-amber-500/30 hover:border-amber-400/60",
              emerald: "border-emerald-500/30 hover:border-emerald-400/60",
              cyan: "border-cyan-500/30 hover:border-cyan-400/60",
              purple: "border-purple-500/30 hover:border-purple-400/60",
            };
            const badgeMap = {
              amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
              emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
              cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
              purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
            };
            return (
              <div
                key={item.title}
                className={`p-6 sm:p-7 rounded-3xl bg-slate-900/90 border ${borderMap[item.accent]} shadow-xl flex flex-col justify-between space-y-4 transition-all`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${badgeMap[item.accent]}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeMap[item.accent]}`}
                    >
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
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
                    >
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

      {/* Sadece 3 Adımda Nasıl Başlarsınız? */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
            Çok Basit Başlangıç
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Sadece 3 Adımda Nasıl Kullanırsınız?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Program indirmek veya form doldurmak gerekmez — 30 saniyede hazırdır:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              1. ADIM
            </span>
            <h3 className="text-sm font-bold text-white">
              Çocuğunuzun Adını ve Sınıfını Seçin
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              &ldquo;🎓 Veli Karnesi&rdquo; butonuna basın, üstteki{" "}
              <strong className="text-slate-200">&ldquo;Çocuğumun Adını & Sınıfını Gir&rdquo;</strong>{" "}
              kısmından çocuğunuzun adını (Örn: Zeynep) ve sınıfını (1. sınıftan 8. sınıfa veya Lise/YDS) seçip kaydedin.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              2. ADIM
            </span>
            <h3 className="text-sm font-bold text-white">
              Günde Sadece 10 Dakika Oyun Oynasın
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Çocuğunuz kendi sınıfının kelime kartlarını dinlesin veya 8 eğitici oyundan sevdiğini oynasın. Zorlama olmadan, eğlenerek kelimeleri hafızasına alsın.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              3. ADIM
            </span>
            <h3 className="text-sm font-bold text-white">
              3 Kelime Sorun & Başarısını Kutlayın
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Akşam yemeğinde karnedeki <strong className="text-slate-200">&ldquo;3 Kelime&rdquo;</strong> oyununu açıp çocuğunuza sorun ve tek tuşla WhatsApp&apos;tan gurur mesajınızı gönderin!
            </p>
          </div>
        </div>
      </div>

      {/* Velilerimizin İçini Rahatlatan 4 Güven Sözümüz */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
            Aile Güvencesi
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Çocuğunuz Ekran Başındayken İçiniz Neden Çok Rahat Olmalı?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAFETY_PROMISES.map((s) => (
            <div
              key={s.title}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
            >
              <div className="text-2xl">{s.emoji}</div>
              <h3 className="text-sm sm:text-base font-bold text-white">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sıkça Sorulan Sorular */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>Velilerimizin En Çok Merak Ettiği Sorular</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PARENT_FAQS.map((item) => (
            <div
              key={item.q}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2"
            >
              <h3 className="text-sm font-bold text-amber-300">{item.q}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alt Çağrı (CTA) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-white">
            Çocuğunuzun İlk Başarı Karnesini Görmeye Hazır mısınız?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Şimdi karneyi açıp çocuğunuzun adını ve sınıfını seçin; akşam yemeğinde soracağınız ilk 3 kelimeyi hemen görün!
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenModal("report")}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:scale-105 transition-all whitespace-nowrap cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Veli Karnesini Aç</span>
          </button>
          <Link
            href="/profile/"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all whitespace-nowrap"
          >
            <span>Veli Takip Merkezi&apos;ne Git</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Dahili Karne Modalı */}
      <ParentReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        reportData={reportData}
        initialTab={modalTab}
      />
    </div>
  );
}
