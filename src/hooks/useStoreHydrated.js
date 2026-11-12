"use client";

import { useEffect, useState } from "react";
import { useMemolandumStore } from "../store/useMemolandumStore";

/**
 * Zustand persist rehydrate bitmeden UI/oyun varsayılan seviyeye düşmesin.
 * SSR ve ilk client hydration geçişinde tutarlı (false) başlar, mount sonrası true olur.
 */
export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const api = useMemolandumStore.persist;
    if (!api) {
      setHydrated(true);
      return undefined;
    }
    if (api.hasHydrated?.()) {
      setHydrated(true);
      return undefined;
    }
    const unsub = api.onFinishHydration?.(() => setHydrated(true));
    return typeof unsub === "function" ? unsub : undefined;
  }, []);

  return hydrated;
}
