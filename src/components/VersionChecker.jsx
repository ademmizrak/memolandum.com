"use client";

import { useEffect } from 'react';

export default function VersionChecker() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const checkVersion = async () => {
      try {
        // Fetch server version with cache buster query parameter
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        const serverVersion = data?.version;
        if (!serverVersion) return;

        const localVersion = localStorage.getItem('memolandum_client_version');

        if (!localVersion) {
          // First run: store current version and proceed
          localStorage.setItem('memolandum_client_version', String(serverVersion));
        } else if (localVersion !== String(serverVersion)) {
          console.log(`[VersionChecker] 🚀 New update detected: ${serverVersion} (local: ${localVersion}). Refreshing client cache...`);
          
          // Store new version
          localStorage.setItem('memolandum_client_version', String(serverVersion));

          // Unregister Service Workers
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const registration of registrations) {
                await registration.unregister();
              }
            } catch (swErr) {
              console.warn('[VersionChecker] SW unregister error:', swErr);
            }
          }

          // Clear Cache Storage (Cache API)
          if ('caches' in window) {
            try {
              const keys = await caches.keys();
              for (const key of keys) {
                await caches.delete(key);
              }
            } catch (cacheErr) {
              console.warn('[VersionChecker] Cache clear error:', cacheErr);
            }
          }

          // Force reload page to fetch latest JS/HTML bundles
          window.location.reload();
        }
      } catch (err) {
        console.warn('[VersionChecker] Failed to verify app version:', err);
      }
    };

    // Check version on initial load
    checkVersion();
    
    // Check every 5 minutes (300,000ms) for open tabs/sessions
    const interval = setInterval(checkVersion, 300000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
