"use client";

import React, { useEffect, useState } from "react";
import { useMemolandumStore } from "../store/useMemolandumStore";
import {
  STUDY_LANG_PRESETS,
  saveActiveProfileMeta,
  saveStudyProfileCloud,
} from "../lib/profiles/studyProfileService";
import { auth } from "../lib/firebase/config";

/**
 * Dil bazlı öğrenme profilleri — aynı hesapta birden fazla dil yolu.
 */
export default function StudyProfilesPanel() {
  const {
    studyProfiles,
    activeStudyProfileId,
    ensureDefaultStudyProfile,
    addStudyProfile,
    switchStudyProfile,
    getActiveStudyProfile,
    profileStatsMap,
    isAuthenticated,
  } = useMemolandumStore();

  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    ensureDefaultStudyProfile();
  }, [ensureDefaultStudyProfile]);

  const active = getActiveStudyProfile();

  const handleSwitch = async (id) => {
    setError("");
    switchStudyProfile(id);
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await saveActiveProfileMeta(uid, id);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleCreate = async (langPair, label) => {
    setError("");
    setCreating(true);
    try {
      const id = addStudyProfile(langPair, label);
      const uid = auth.currentUser?.uid;
      const profile = useMemolandumStore.getState().studyProfiles.find((p) => p.id === id);
      if (uid && profile) {
        await saveStudyProfileCloud(uid, profile);
        await saveActiveProfileMeta(uid, id);
      }
    } catch (e) {
      setError(e?.message || "Profil oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  };

  const existingPairs = new Set(studyProfiles.map((p) => p.langPair));
  const available = STUDY_LANG_PRESETS.filter((p) => !existingPairs.has(p.langPair));

  return (
    <section className="profile-section">
      <h2>Dil Profilleri</h2>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">
        Aynı hesapla birden fazla dil yolu açabilirsin. Her profilin XP ve ilerlemesi ayrı hatırlanır.
        {!isAuthenticated && " Misafirken de çalışır; üye olursan buluta taşınır."}
      </p>

      <div className="flex flex-col gap-2 mb-5">
        {studyProfiles.map((p) => {
          const stats = profileStatsMap[p.id] || {};
          const isActive = p.id === activeStudyProfileId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSwitch(p.id)}
              className={`text-left rounded-xl border px-4 py-3 transition-all ${
                isActive
                  ? "border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                  : "border-white/10 bg-slate-900/40 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-sm">
                    {p.label}
                    {isActive && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-cyan-300">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{p.langPair}</div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div className="text-purple-300 font-bold">{Number(stats.total_xp) || 0} XP</div>
                  <div>💎 {Number(stats.gems) || 0}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {available.length > 0 && (
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Yeni dil profili ekle
          </div>
          <div className="flex flex-wrap gap-2">
            {available.slice(0, 8).map((p) => (
              <button
                key={p.langPair}
                type="button"
                disabled={creating}
                onClick={() => handleCreate(p.langPair, p.label)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-50"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      {active && (
        <p className="text-xs text-slate-500 mt-4">
          Şu an <span className="text-cyan-300 font-semibold">{active.label}</span> profilindesin.
          Ana sayfadaki dil seçimi bu yola göre devam eder.
        </p>
      )}
    </section>
  );
}
