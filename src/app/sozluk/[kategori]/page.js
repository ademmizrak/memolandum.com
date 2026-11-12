import React from "react";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import CategoryClient from "./CategoryClient";
import { getCategoryBySlug, getConceptsByCategory, toLightweightConcept } from "@/lib/glossary";
import { absoluteUrl } from "@/lib/seo/siteConfig";

// Pre-render static paths for all 10 categories
export async function generateStaticParams() {
  return [
    { kategori: "cografya" },
    { kategori: "genel-kultur" },
    { kategori: "matematik-geometri" },
    { kategori: "tarih" },
    { kategori: "turkce" },
    { kategori: "vatandaslik" },
    { kategori: "astronomi-uzay" },
    { kategori: "hukuk" },
    { kategori: "mimari" },
    { kategori: "tip" }
  ];
}

// Generate dynamic metadata for the category
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const categorySlug = resolvedParams.kategori;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Kategori Bulunamadı",
      description: "Aradığınız sözlük kategorisi bulunamadı."
    };
  }

  const title = `${category.name} Sözlüğü${
    category.tags?.includes("KPSS") ? " · KPSS" : ""
  }`;
  const description = `${category.count} kavram — ${category.desc} Retro Shooter ve My Lexicon ile ezberleyin. ${
    category.tags?.join(", ") || "Akademik sözlük"
  }.`;
  const url = absoluteUrl(`/sozluk/${categorySlug}/`);

  return {
    title,
    description,
    keywords: [
      ...(category.tags || []),
      `${category.name} sözlük`,
      `${category.name} kelime ezberleme`,
      "KPSS sözlük",
      "akademik kavram",
      "memolandum sözlük",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const categorySlug = resolvedParams.kategori;

  const category = getCategoryBySlug(categorySlug);
  if (!category) {
    notFound();
  }

  const concepts = getConceptsByCategory(categorySlug).map(toLightweightConcept);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": absoluteUrl(`/sozluk/${categorySlug}/`),
    "name": `${category.name} Terimleri Sözlüğü | Memolandum`,
    "description": category.desc,
    "url": absoluteUrl(`/sozluk/${categorySlug}/`)
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <CategoryClient category={category} concepts={concepts} />
    </>
  );
}
