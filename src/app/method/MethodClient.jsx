"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";

const ARTICLE = {
  tr: {
    eyebrow: "Memolandum Pulse™",
    title: "Kelimeleri unutmamak için beynin ritmini takip ediyoruz",
    lead:
      "Ezber listeleri ezmek zorunda değilsin. Memolandum, oyun oynarken doğru anda doğru kelimeyi karşısına çıkaran bilimsel bir tekrar ritmi kullanır. Adı: Memolandum Pulse.",
    sections: [
      {
        h: "Neden kelimeler aklımızda durmuyor?",
        p: [
          "Yeni bir kelimeyi öğrendiğinde beynin “bunu saklayayım mı?” diye karar verir. Tekrar etmezsen, saatler içinde büyük kısmı silinir. Buna unutma eğrisi denir — 1885’ten beri bilinen bir gerçek.",
          "Çözüm daha çok çalışmak değil: kelimeyi unutmak üzere olduğun anda kısa bir tekrar. Buna aralıklı tekrar (spaced repetition) denir.",
        ],
      },
      {
        h: "Active recall: bakmak değil, hatırlamak",
        p: [
          "Listeyi okumak hafızayı zayıf güçlendirir. Asıl güç, cevabı kendin üretmektir: şıklardan seçmek, nişan almak, doğru şeritte ilerlemek.",
          "Araştırmalar (Roediger & Karpicke) şunu gösteriyor: aktif hatırlama, tekrar okumaktan çok daha kalıcı öğrenme sağlar. Oyunlarımız tam da bunu ister — kelimeyi “görmeni” değil, “kullanmanı”.",
        ],
      },
      {
        h: "Memolandum Pulse nasıl çalışır?",
        p: [
          "Pulse, her kelime için kişisel bir nabız tutar: ne zaman tekrar edilmeli, ne kadar kolay geldi, kaç kez kaçırdın.",
          "Kısaca şöyle işler:",
        ],
        bullets: [
          "Doğru ve hızlıysan → aralık uzar (beyin “bunu biliyorum” der).",
          "Doğru ama yavaş / zorlandıysan → biraz daha erken tekrar gelir.",
          "Yanlışsan → kelime hemen “tekrar kuyruğuna” alınır; unutulmaya bırakılmaz.",
          "Yeni kelimeler önce kısa adımlarla pekiştirilir, sonra günler–haftalar ölçeğinde aralanır.",
        ],
        after:
          "Bu yüzden aynı kelimeyi her gün aynı sıklıkta görmezsin. Zayıf ve “vakti gelen” kelimeler öne çıkar; iyice oturanlar seyreltilir. Amaç: daha az sürtünmeyle daha hızlı kalıcılık.",
      },
      {
        h: "Oyunda ne hissedersin?",
        p: [
          "Retro Quiz, Shooter, Highway ve diğer oyunlarda Pulse arka planda çalışır. Sen skora ve akışa odaklanırsın; sistem hangi kelimenin bugün tekrar edilmesi gerektiğini seçer.",
          "Doğru vuruştan sonra kelimeyi bir an ekranda tutmamızın sebebi de bu: hatırlama anını bilinçli okumaya bağlamak.",
        ],
      },
      {
        h: "Kelime Kasası’nda ne görürsün?",
        p: [
          "Kasada her kelimenin bir “gücü” (Yeni → Usta) ve bir tekrar zamanı vardır.",
          "“Due Tekrar” butonu: bugün tekrar edilmesi gereken kelimeleri getirir. Bunu düzenli yapmak, unutma eğrisini senin lehine çevirir.",
        ],
      },
      {
        h: "Neden “sadece 3 kez doğru vur = öğrenildi” demiyoruz?",
        p: [
          "Çünkü bellek zamanla çalışır, sayaçla değil. Üç kez üst üste bilmek iyi bir sinyaldir; ama asıl kalıcılık, günler sonra hâlâ hatırlayabilmendir.",
          "Pulse bu yüzden “kaç kez?” sorusundan çok “ne zaman tekrar?” sorusuna cevap verir — bilimsel olarak daha doğru, kullanıcı olarak da daha adil.",
        ],
      },
    ],
    closing:
      "Özetle: oyna, hatırla, Pulse zamanlasın. Memolandum’un vaadi ezber işkencesi değil; beynin doğal ritmine uygun, hızlı ve kalıcı kelime öğrenmek.",
    ctaPlay: "Oyuna dön",
    ctaVault: "Kelime Kasası",
    ctaAbout: "Daha fazla bilim",
    langBtn: "English",
  },
  en: {
    eyebrow: "Memolandum Pulse™",
    title: "We follow your brain’s rhythm so words stick",
    lead:
      "You don’t need endless word lists. Memolandum uses a scientific review rhythm that brings the right word back at the right moment—while you play. We call it Memolandum Pulse.",
    sections: [
      {
        h: "Why do words slip away?",
        p: [
          "When you meet a new word, your brain decides whether to keep it. Without review, most of it fades within hours. That’s the forgetting curve—known since 1885.",
          "The fix isn’t “study harder.” It’s a short recall just as you’re about to forget. That’s spaced repetition.",
        ],
      },
      {
        h: "Active recall beats re-reading",
        p: [
          "Looking at a list is weak practice. Strong practice is retrieving the answer yourself—picking a choice, shooting a target, staying in the right lane.",
          "Research (Roediger & Karpicke) shows active recall builds far stronger memory than re-reading. Our games ask you to use the word, not just see it.",
        ],
      },
      {
        h: "How Memolandum Pulse works",
        p: [
          "Pulse keeps a personal schedule for every word: when it’s due, how easy it felt, how often you missed it.",
          "In plain terms:",
        ],
        bullets: [
          "Correct & fast → longer gap (your brain tags it as known).",
          "Correct but slow / hard → earlier next review.",
          "Wrong → the word returns to the front of the queue—never abandoned.",
          "New words get short learning steps first, then day–week spacing.",
        ],
        after:
          "That’s why you don’t see every word equally often. Weak and due words rise; well-mastered ones thin out. Goal: less friction, faster permanence.",
      },
      {
        h: "What it feels like in-game",
        p: [
          "In Retro Quiz, Shooter, Highway and more, Pulse runs in the background. You focus on flow and score; the system prioritizes what’s due today.",
          "We also hold the word on screen briefly after a correct hit—so recall meets a moment of conscious reading.",
        ],
      },
      {
        h: "What you’ll see in the Vocabulary Vault",
        p: [
          "Each word has a strength level (New → Master) and a next-review time.",
          "“Due review” surfaces words that need practice today. Doing that regularly tilts the forgetting curve in your favor.",
        ],
      },
      {
        h: "Why we don’t say “3 correct hits = learned”",
        p: [
          "Memory is about time, not just a counter. Three wins in a row is a good signal—but lasting knowledge is recalling days later.",
          "Pulse answers “when again?” more than “how many times?”—scientifically sounder, and fairer to you.",
        ],
      },
    ],
    closing:
      "In short: play, recall, let Pulse schedule. Memolandum isn’t grind—it’s fast, durable vocabulary on your brain’s natural rhythm.",
    ctaPlay: "Back to play",
    ctaVault: "Vocabulary Vault",
    ctaAbout: "More science",
    langBtn: "Türkçe",
  },
};

export default function MethodClient() {
  const [lang, setLang] = useState("tr");
  const a = ARTICLE[lang];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      <Header />
      <article className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3 mb-6">
          <p className="m-0 text-[11px] font-bold tracking-[0.18em] uppercase text-amber-500/80">
            {a.eyebrow}
          </p>
          <button
            type="button"
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            className="text-xs font-semibold text-cyan-300/90 border border-cyan-500/30 rounded-lg px-3 py-1.5 hover:bg-cyan-500/10"
          >
            {a.langBtn}
          </button>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight m-0 mb-4 leading-tight">
          {a.title}
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed m-0 mb-10">{a.lead}</p>

        {a.sections.map((s) => (
          <section key={s.h} className="mb-9">
            <h2 className="text-xl font-bold text-amber-100/95 m-0 mb-3">{s.h}</h2>
            {s.p.map((para) => (
              <p key={para.slice(0, 40)} className="text-slate-400 leading-relaxed m-0 mb-3">
                {para}
              </p>
            ))}
            {s.bullets && (
              <ul className="m-0 mb-3 pl-5 space-y-2 text-slate-300 leading-relaxed">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {s.after && (
              <p className="text-slate-400 leading-relaxed m-0 mt-2">{s.after}</p>
            )}
          </section>
        ))}

        <p className="text-base text-emerald-200/90 leading-relaxed font-medium border-l-2 border-emerald-400/40 pl-4 m-0 mb-10">
          {a.closing}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm no-underline hover:bg-amber-400"
          >
            {a.ctaPlay}
          </Link>
          <Link
            href="/vocabulary/"
            className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-600 text-slate-200 font-semibold text-sm no-underline hover:border-cyan-400/50"
          >
            {a.ctaVault}
          </Link>
          <Link
            href="/about/"
            className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-semibold text-sm no-underline hover:text-slate-200"
          >
            {a.ctaAbout}
          </Link>
        </div>
      </article>
    </div>
  );
}
