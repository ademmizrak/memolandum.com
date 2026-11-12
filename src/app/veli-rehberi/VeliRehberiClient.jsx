"use client";

import React from "react";
import Header from "../../components/Header";
import ParentGuide from "../../components/profile/ParentGuide";

export default function VeliRehberiClient() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ParentGuide />
      </main>
    </div>
  );
}
