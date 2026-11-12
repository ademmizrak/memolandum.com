import React from "react";
import Link from "next/link";
import Header from "@/components/Header";

export default function GlossaryNotFound() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <Header />
      <main className="max-w-xl mx-auto px-4 pt-24 text-center">
        <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block mb-4">
          HATA 404
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
          Kavram Bulunamadı
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
          Aradığınız terim veya sözlük kategorisi mevcut değil ya da kaldırılmış olabilir. Sözlük ana sayfasından aramayı tekrar deneyebilirsiniz.
        </p>
        <Link
          href="/sozluk/"
          className="inline-flex items-center justify-center py-3 px-6 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
        >
          Sözlük Ana Sayfasına Dön
        </Link>
      </main>
    </div>
  );
}
