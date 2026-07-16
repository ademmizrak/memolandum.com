'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';
import { useMemolandumStore } from '../store/useMemolandumStore';
import {
  syncUserProgress,
  completeGoogleRedirectIfAny,
  isGoogleRedirectPending,
} from '../lib/firebase/authService';
import {
  ensureCloudStudyProfiles,
  fetchActiveProfileMeta,
  fetchProfileStats,
  saveStudyProfileCloud,
} from '../lib/profiles/studyProfileService';

const AUTH_BOOT_TIMEOUT_MS = 4000;
const AUTH_REDIRECT_BOOT_MS = 20000;

export default function AuthProvider({ children }) {
  const { setAuthUser, isAuthLoading, syncGlobalStats, setVocabularyVault, resetLocalProgress, clearForAccountSwitch } = useMemolandumStore();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    let unsubVault = null;
    let syncInFlight = false;
    let unsubscribe = null;
    let settled = false;
    let cancelled = false;

    const finishBoot = (asGuest = false) => {
      if (settled || cancelled) return;
      settled = true;
      // Redirect dönüşünde timeout, currentUser varken misafire düşmesin
      if (asGuest && !auth?.currentUser) {
        setAuthUser(null);
      }
      setInitialCheckDone(true);
    };

    const pendingRedirect = isGoogleRedirectPending();
    const bootMs = pendingRedirect ? AUTH_REDIRECT_BOOT_MS : AUTH_BOOT_TIMEOUT_MS;

    const bootTimer = setTimeout(() => {
      if (!settled) {
        console.warn('Auth boot timeout — misafir olarak devam');
        finishBoot(true);
      }
    }, bootMs);

    if (!auth) {
      console.warn('Firebase Auth yok — misafir modunda devam');
      clearTimeout(bootTimer);
      finishBoot(true);
      return () => clearTimeout(bootTimer);
    }

    (async () => {
      try {
        await completeGoogleRedirectIfAny();
      } catch (e) {
        console.warn('Redirect auth tamamlanamadı:', e?.message || e);
      }
    })();

    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        const previousUid = useMemolandumStore.getState().uid;
        setAuthUser(user);

        if (user) {
          if (!syncInFlight) {
            syncInFlight = true;
            try {
              await syncUserProgress(user);
              // Dil profilleri: yoksa oluştur, aktif olanı yükle
              const store = useMemolandumStore.getState();
              store.ensureDefaultStudyProfile?.();
              const profiles = await ensureCloudStudyProfiles(user.uid, {
                langPair: store.getActiveStudyProfile?.()?.langPair || 'en-tr',
                label: store.getActiveStudyProfile?.()?.label,
              });
              const activeFromCloud = await fetchActiveProfileMeta(user.uid);
              const activeId =
                activeFromCloud && profiles.some((p) => p.id === activeFromCloud)
                  ? activeFromCloud
                  : store.activeStudyProfileId && profiles.some((p) => p.id === store.activeStudyProfileId)
                    ? store.activeStudyProfileId
                    : profiles[0]?.id;
              const statsById = {};
              for (const p of profiles) {
                statsById[p.id] = await fetchProfileStats(user.uid, p.id);
              }
              useMemolandumStore.getState().hydrateStudyProfiles({
                profiles,
                activeId,
                statsById,
              });
              // Lokalde olup cloud'da olmayan profilleri yaz
              for (const p of store.studyProfiles || []) {
                if (!profiles.some((c) => c.id === p.id)) {
                  await saveStudyProfileCloud(user.uid, p);
                }
              }
            } catch (e) {
              console.warn('syncUserProgress/profiles failed:', e?.message || e);
            } finally {
              syncInFlight = false;
            }
          }

          if (db) {
            const vaultRef = collection(db, 'users', user.uid, 'vault');
            unsubVault = onSnapshot(
              vaultRef,
              (querySnap) => {
                const vault = {};
                querySnap.forEach((docSnap) => {
                  vault[docSnap.id] = docSnap.data();
                });
                setVocabularyVault(vault);
              },
              (err) => console.warn('vault snapshot error:', err?.message || err)
            );
          }
        } else {
          if (unsubVault) {
            unsubVault();
            unsubVault = null;
          }

          if (previousUid) {
            (clearForAccountSwitch || resetLocalProgress)();
            setVocabularyVault({});
          }
        }

        finishBoot();
      });
    } catch (err) {
      console.error('onAuthStateChanged failed:', err);
      finishBoot(true);
    }

    return () => {
      cancelled = true;
      clearTimeout(bootTimer);
      if (unsubscribe) unsubscribe();
      if (unsubVault) unsubVault();
    };
  }, [setAuthUser, syncGlobalStats, setVocabularyVault, resetLocalProgress, clearForAccountSwitch]);

  // Aktif dil profilinin stats dinleyicisi (profil değişince yeniden bağlanır)
  const activeStudyProfileId = useMemolandumStore((s) => s.activeStudyProfileId);
  const uid = useMemolandumStore((s) => s.uid);
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !uid || !activeStudyProfileId) return undefined;
    const statsPath = doc(db, 'users', uid, 'profileStats', activeStudyProfileId);
    const unsub = onSnapshot(
      statsPath,
      (docSnap) => {
        if (docSnap.exists()) {
          syncGlobalStats(docSnap.data());
        }
      },
      (err) => console.warn('profileStats snapshot error:', err?.message || err)
    );
    return () => unsub();
  }, [isAuthenticated, uid, activeStudyProfileId, syncGlobalStats]);

  // Düzenli aralıklarla (5 dakikada bir) Firebase Firestore veritabanına otomatik yedekleme yapar
  useEffect(() => {
    if (!isAuthenticated || !uid || !auth?.currentUser) return undefined;

    const backupInterval = setInterval(async () => {
      try {
        console.log("🔄 Düzenli Firebase yedekleme döngüsü tetiklendi...");
        await syncUserProgress(auth.currentUser);
      } catch (err) {
        console.warn("Düzenli yedekleme başarısız:", err?.message || err);
      }
    }, 5 * 60 * 1000); // 5 dakika

    return () => clearInterval(backupInterval);
  }, [isAuthenticated, uid]);

  if (!initialCheckDone || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
