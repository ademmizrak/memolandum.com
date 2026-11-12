"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { resolveDataUrl } from "@/lib/contentCdn";

/**
 * Fallback SPA shell for /sozluk/:kategori/:slug/ if a dynamic slug is requested.
 */
export default function SozlukConceptSpa() {
  const [concept, setConcept] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const parts = window.location.pathname.split("/").filter(Boolean);
        // ["sozluk", ":kategori", ":slug"]
        const kategori = parts[1];
        const slug = parts[2];
        if (!kategori || !slug) {
          setError("Geçersiz sözlük yolu");
          return;
        }
        const url = `${resolveDataUrl("academic/glossary-index.json")}?v=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list = await res.json();
        const hit = Array.isArray(list)
          ? list.find((c) => c.category === kategori && c.slug === slug)
          : null;
        if (!hit) {
          setError("Kavram bulunamadı");
          return;
        }
        if (!cancelled) setConcept(hit);
      } catch (e) {
        if (!cancelled) setError(e.message || "Yükleme hatası");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        {loading && <p className="text-cyan-400 animate-pulse">Yükleniyor…</p>}
        {error && !loading && (
          <div className="space-y-4">
            <p className="text-rose-400">{error}</p>
            <Link href="/sozluk/" className="text-cyan-400 underline">
              Sözlüğe dön
            </Link>
          </div>
        )}
        {concept && (
          <article className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              <Link href={`/sozluk/${concept.category}/`} className="hover:text-cyan-400">
                {concept.categoryName || concept.category}
              </Link>
            </p>
            <h1 className="text-3xl font-black text-white">{concept.title}</h1>
            {concept.description && (
              <p className="text-lg text-slate-300 leading-relaxed">{concept.description}</p>
            )}
            {concept.content && (
              <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
                {concept.content}
              </div>
            )}
            <Link href="/sozluk/" className="inline-block text-cyan-400 underline mt-6">
              Tüm sözlük
            </Link>
          </article>
        )}
      </main>
    </div>
  );
}
