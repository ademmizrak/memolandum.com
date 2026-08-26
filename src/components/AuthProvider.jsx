'use client';

import { useEffect } from 'react';
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
import { subscribeToPremiumStatus } from '../lib/premium/premiumService';
import {
  ensureRevenueCatConfigured,
  isNativeIapPlatform,
  resetRevenueCatSession,
  syncPremiumFromRevenueCat,
} from '../lib/premium/revenueCat';

const AUTH_BOOT_TIMEOUT_MS = 4000;
const AUTH_REDIRECT_BOOT_MS = 20000;
/** Auth takılsa bile splash sonsuz kalmasın (L2 — L1 RC/auth'u bozmaz) */
const SPLASH_HARD_FALLBACK_MS = 6500;

export default function AuthProvider({ children }) {
  const { setAuthUser, syncGlobalStats, setVocabularyVault, resetLocalProgress, clearForAccountSwitch, setPremium } = useMemolandumStore();

  useEffect(() => {
    let unsubVault = null;
    let unsubPremium = null;
    let syncInFlight = false;
    let unsubscribe = null;
    let settled = false;
    let cancelled = false;
    let splashHidden = false;

    const hideSplashScreen = async () => {
      if (splashHidden || cancelled) return;
      splashHidden = true;
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          await SplashScreen.hide();
        }
      } catch (e) {
        /* ignore */
      }
    };

    const finishBoot = (asGuest = false) => {
      if (settled || cancelled) return;
      settled = true;
      // Boot tamamlandı — eğer lokalde authenticated bir kullanıcı varsa asla misafire düşürme
      const storeState = useMemolandumStore.getState();
      if (asGuest && !auth?.currentUser && !storeState.isAuthenticated) {
        setAuthUser(null);
      }
      hideSplashScreen();
    };

    // Hard fallback: finishBoot hiç gelmese bile splash kapanır
    const splashFallbackTimer = setTimeout(() => {
      hideSplashScreen();
    }, SPLASH_HARD_FALLBACK_MS);

    const pendingRedirect = isGoogleRedirectPending();
    const bootMs = pendingRedirect ? AUTH_REDIRECT_BOOT_MS : AUTH_BOOT_TIMEOUT_MS;

    const bootTimer = setTimeout(() => {
      if (!settled) {
        console.warn('Auth boot timeout — mevcut oturum korunuyor');
        finishBoot(true);
      }
    }, bootMs);

    if (!auth) {
      console.warn('Firebase Auth yok — yerel oturumla devam');
      clearTimeout(bootTimer);
      clearTimeout(splashFallbackTimer);
      finishBoot(true);
      return () => {
        clearTimeout(bootTimer);
        clearTimeout(splashFallbackTimer);
      };
    }

    (async () => {
      try {
        await completeGoogleRedirectIfAny();
      } catch (e) {
        console.warn('Redirect auth tamamlanamadı:', e?.message || e);
      }
    })();

    const bootNativePremium = async (user) => {
      try {
        if (!(await isNativeIapPlatform()) || !user?.uid) return;
        await ensureRevenueCatConfigured(user.uid);
        await syncPremiumFromRevenueCat();
      } catch (e) {
        console.warn("RevenueCat Initialization failed:", e?.message || e);
      }
    };

    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        const previousUid = useMemolandumStore.getState().uid;
        
        if (user) {
          setAuthUser(user);

          // Sadece farklı bir kullanıcı hesabına geçiş yapılıyorsa verileri temizle
          const lastAuthenticatedUid = useMemolandumStore.getState().lastAuthenticatedUid;
          if (lastAuthenticatedUid && lastAuthenticatedUid !== user.uid) {
            (clearForAccountSwitch || resetLocalProgress)();
            setVocabularyVault({});
            resetRevenueCatSession();
          }

          // Configure bitmeden satın alma açılmasın — await
          await bootNativePremium(user);

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
            unsubPremium = subscribeToPremiumStatus(user.uid, (active) => {
              // Native'de RC premium'u boş Firestore billing false ile ezilmez (store koruması)
              setPremium(!!active, { source: "firestore" });
            });
          }
        } else {
          // Firebase oturumu kapandıysa: Sadece internet varsa ve kullanıcı gerçekten çıkış yaptıysa yerel oturumu bitir (verileri sıfırlamadan!)
          if (typeof window !== "undefined" && window.navigator && window.navigator.onLine) {
            setAuthUser(null);
          }
          if (unsubVault) {
            unsubVault();
            unsubVault = null;
          }
          if (unsubPremium) {
            unsubPremium();
            unsubPremium = null;
          }
          resetRevenueCatSession();
          setPremium(false, { source: "manual" });
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
      clearTimeout(splashFallbackTimer);
      if (unsubscribe) unsubscribe();
      if (unsubVault) unsubVault();
      if (unsubPremium) unsubPremium();
    };
  }, [setAuthUser, syncGlobalStats, setVocabularyVault, resetLocalProgress, clearForAccountSwitch, setPremium]);

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

  // Bildirim izni cold-boot'ta istenmez (L2) — kasa güncellenince scheduleDailySrsReminder bağlamsal ister.

  // Auth arka planda bitsin; çocukları asla tam ekran spinner ile unmount etme.
  // (Eski davranış: SSG spinner → hydrate → anasayfa = yanıp sönme / çift yükleme hissi)
  return <>{children}</>;
}
