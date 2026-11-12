"use client";

import React from "react";
import GlossaryCard from "./GlossaryCard";

export default function RelatedConcepts({ relatedConcepts = [], categoryConcepts = [] }) {
  if (!relatedConcepts || relatedConcepts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            İlginizi Çekebilecek Diğer Kavramlar
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Aynı kategoriden ilişkili kavramları inceleyerek kelime haznenizi genişletin.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {relatedConcepts.map((concept) => (
          <GlossaryCard
            key={concept.id}
            concept={concept}
            categoryConcepts={categoryConcepts}
          />
        ))}
      </div>
    </section>
  );
}
