import { useState, useEffect, useCallback } from 'react';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { db } from '../lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { gameManifest } from '../config/manifest';

/**
 * useLessonLoader hook'u, oyun için gerekli olan kelime setini getirir.
 * Şimdilik fallback olarak yerel JSON dosyalarını (veya mock veriyi) destekler,
 * ancak gelecekte kullanıcının lesson_progress koleksiyonundan
 * o an tekrar etmesi gereken kelimeleri çekecek şekilde genişletilebilir.
 */
export function useLessonLoader(levelId, langId) {
  const { uid } = useMemolandumStore();
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Firebase'den çekmeyi deneyebiliriz (Örn: lesson_progress tablosu)
      // Ancak şimdilik PRD'deki yapıyı kurmak adına eski local fetch mantığını simüle edip
      // ileride Firestore entegrasyonu için açık kapı bırakıyoruz.
      
      let fetchedWords = [];
      
      // 1. Manifest üzerinden ilgili verileri bul
      let levelConfig = null;
      for (const mainCat of gameManifest.mainCategories) {
        for (const subCat of mainCat.subCategories) {
          if (subCat.id === langId) {
            const lvl = subCat.levels.find(l => l.id === levelId);
            if (lvl) {
              levelConfig = lvl;
              break;
            }
          }
        }
        if (levelConfig) break;
      }

      if (levelConfig) {
        // 2. Local public/data altındaki JSON'ı çek
        const response = await fetch(`/data/${levelConfig.path}`);
        if (response.ok) {
          const wordsData = await response.json();
          const rawWords = Array.isArray(wordsData) ? wordsData : (wordsData.words || []);
          
          const basePath = levelConfig.path.split('/')[0];

          fetchedWords = rawWords.map(w => {
            const english = w.english || w.original_script || w.word || w.mission_word || w.mission_phrase;
            const turkish = w.turkish || w.meaning || w.translation || w.target_translation;
            const safeWord = (english || "").toLowerCase().replace(/[^a-z0-9]/g, '_');
            let audioUrl = w.audioUrl || `/data/${basePath}/Audio/${w.id}_${safeWord}.mp3`;
            if (audioUrl.startsWith('/data/data/')) {
              audioUrl = audioUrl.replace('/data/data/', '/data/');
            }
            const romanized = w.romanized_script || w.romanized || '';

            return {
              ...w,
              english,
              turkish,
              romanized,
              audioUrl
            };
          });
        }
      }

      // Eğer hala boşsa sahte veri dön (Kaldırıldı, veritabanı boşsa boş kalsın, hata versin)
      if (fetchedWords.length === 0) {
        throw new Error("Veritabanından kelime çekilemedi veya JSON boş.");
      }
      
      setWords(fetchedWords);
    } catch (err) {
      console.error("Kelime yükleme hatası:", err);
      setError(err);
      // Fallback
      setWords([{ english: 'error', turkish: 'hata' }]);
    } finally {
      setIsLoading(false);
    }
  }, [levelId, langId, uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWords();
  }, [loadWords]);

  return {
    words,
    isLoading,
    error,
    reload: loadWords
  };
}
