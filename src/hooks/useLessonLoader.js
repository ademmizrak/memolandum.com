import { useState, useEffect, useCallback } from 'react';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { gameManifest } from '../config/manifest';
import { sanitizeWordData } from '../lib/learning/levelSterilizer';
import { selectAdaptiveWords, SESSION_WORD_TARGET } from '../lib/learning/adaptiveWordSelector';
import { findVaultItem } from '../lib/learning/memolandumPulse';
import { resolveDataUrl, resolveLessonJsonUrls } from '../lib/contentCdn';

export { resolveDataUrl, resolveLessonJsonUrls } from '../lib/contentCdn';

async function fetchLessonJson(filePath, signal) {
  const bust = `v=${Date.now()}`;
  const urls = resolveLessonJsonUrls(filePath);
  let lastErr = null;
  for (const base of urls) {
    const url = `${base}${base.includes("?") ? "&" : "?"}${bust}`;
    try {
      const response = await fetch(url, { signal });
      if (response.ok) {
        const data = await response.json();
        // Offline cache save
        try {
          localStorage.setItem(`lesson_cache_${filePath}`, JSON.stringify(data));
        } catch (e) {
          // ignore
        }
        return data;
      }
      lastErr = new Error(`HTTP ${response.status} for ${url}`);
      console.warn("[useLessonLoader] JSON fetch failed, trying next…", response.status, url);
    } catch (err) {
      lastErr = err;
      console.warn("[useLessonLoader] JSON fetch error, trying next…", err?.message || err);
    }
  }

  // Offline cache fallback
  try {
    const cached = localStorage.getItem(`lesson_cache_${filePath}`);
    if (cached) {
      console.log(`[useLessonLoader] ⚡ Loaded offline cached data for ${filePath}`);
      return JSON.parse(cached);
    }
  } catch (e) {
    // ignore
  }

  throw lastErr || new Error("Veritabanından kelime çekilemedi veya JSON boş.");
}

/**
 * useLessonLoader hook brings the word set required for the active game level.
 * It supports loading from GCS bucket URLs or falling back to local files,
 * sanitizing word datasets, and applying AI adaptive selection & Fisher-Yates randomization.
 */
export function useLessonLoader(levelId, langId, returnAll = false) {
  const uid = useMemolandumStore((s) => s.uid);
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check for user-selected custom words
      let activeCustomWords = useMemolandumStore.getState().activeCustomWords;
      if (!activeCustomWords || activeCustomWords.length === 0) {
        try {
          if (typeof window !== "undefined" && sessionStorage.getItem("memolandum-custom-play") === "1") {
            const raw = sessionStorage.getItem("memolandum-custom-words");
            if (raw) {
              activeCustomWords = JSON.parse(raw);
            }
          }
        } catch (e) {
          console.warn("Failed to retrieve custom words from sessionStorage:", e);
        }
      }

      if (Array.isArray(activeCustomWords) && activeCustomWords.length > 0) {
        console.log(`[useLessonLoader] 🎯 Özel kelimeler yükleniyor: ${activeCustomWords.length} adet kelime`);
        const sanitizedCustom = sanitizeWordData(activeCustomWords);
        const vocabularyVault = useMemolandumStore.getState().vocabularyVault || {};

        const isWordLearned = (word) => {
          if (!word) return false;
          const found = findVaultItem(vocabularyVault, word);
          if (!found?.item) return false;
          const entry = found.item;
          return entry.learningProgressPct === 100 || entry.firstTryCorrect === true || (Number(entry.reps) || 0) > 0;
        };

        // Split custom words into learned and unlearned
        const customUnlearned = sanitizedCustom.filter(w => !isWordLearned(w));
        const customLearned = sanitizedCustom.filter(w => isWordLearned(w));

        console.log(`[useLessonLoader] Özel kelime durumu - Öğrenilmeyen: ${customUnlearned.length}, Öğrenilen: ${customLearned.length}`);

        let selectedWords = [];

        // CASE 1: Single Concept Detail play (length is exactly 10, first item is target)
        if (sanitizedCustom.length === 10) {
          const targetConcept = sanitizedCustom[0];
          const remainingPool = sanitizedCustom.slice(1);
          const poolUnlearned = remainingPool.filter(w => !isWordLearned(w));
          const poolLearned = remainingPool.filter(w => isWordLearned(w));

          const targetUnlearnedCount = 11;
          const adaptivePool = selectAdaptiveWords(poolUnlearned, vocabularyVault, {
            shuffle: true,
            targetCount: Math.min(targetUnlearnedCount, poolUnlearned.length),
            learnedWeightScale: 0.15,
            dueBias: 0.55,
          });

          selectedWords = [targetConcept, ...adaptivePool];

          // Backfill if needed
          const targetTotal = Math.min(12, sanitizedCustom.length);
          if (selectedWords.length < targetTotal) {
            const remainingCount = targetTotal - selectedWords.length;
            const backfill = poolLearned
              .filter(w => !selectedWords.some(sw => sw.id === w.id))
              .sort(() => 0.5 - Math.random())
              .slice(0, remainingCount);
            selectedWords = [...selectedWords, ...backfill];
          }
        } 
        // CASE 2: Category level play (the list has many concepts, e.g. 400 or more)
        else {
          let chosenLearned = null;
          if (customLearned.length > 0) {
            chosenLearned = customLearned[Math.floor(Math.random() * customLearned.length)];
          }

          const targetUnlearnedCount = chosenLearned ? 11 : 12;
          const adaptiveUnlearned = selectAdaptiveWords(customUnlearned, vocabularyVault, {
            shuffle: true,
            targetCount: Math.min(targetUnlearnedCount, customUnlearned.length),
            learnedWeightScale: 0.15,
            dueBias: 0.55,
          });

          if (chosenLearned) {
            selectedWords = [...adaptiveUnlearned, chosenLearned];
          } else {
            selectedWords = adaptiveUnlearned;
          }

          // Backfill if needed
          const targetTotal = Math.min(12, sanitizedCustom.length);
          if (selectedWords.length < targetTotal) {
            const remainingCount = targetTotal - selectedWords.length;
            const backfill = customLearned
              .filter(w => !selectedWords.some(sw => sw.id === w.id))
              .sort(() => 0.5 - Math.random())
              .slice(0, remainingCount);
            selectedWords = [...selectedWords, ...backfill];
          }
        }

        // Shuffle selected words for random gameplay ordering
        const shuffled = selectedWords.sort(() => 0.5 - Math.random());
        
        setWords(shuffled);
        setIsLoading(false);
        return;
      }

      // Vault'u dependency yapma: doğru cevapta vault güncellenince
      // oyun ortasında "MEMOLANDUM YÜKLENİYOR" flash'ı oluşmasın.
      const vocabularyVault = useMemolandumStore.getState().vocabularyVault || {};
      let fetchedWords = [];
      let levelConfig = null;

      // 1. Locate level in the manifest
      if (levelId) {
        // A. Primary: Look within matching subcategory or main category
        for (const mainCat of gameManifest.mainCategories || []) {
          for (const subCat of mainCat.subCategories || []) {
            if (!langId || subCat.id === langId || mainCat.id === langId) {
              let lvl = subCat.levels?.find(l => l.id === levelId || l.slug === levelId);
              if (!lvl && subCat.sentenceLevels) {
                lvl = subCat.sentenceLevels.find(l => l.id === levelId || l.slug === levelId);
              }
              if (lvl) {
                levelConfig = lvl;
                break;
              }
            }
          }
          if (levelConfig) break;
        }

        // B. Robust fallback: Scan ALL categories by levelId or slug
        if (!levelConfig) {
          for (const mainCat of gameManifest.mainCategories || []) {
            for (const subCat of mainCat.subCategories || []) {
              let lvl = subCat.levels?.find(l => l.id === levelId || l.slug === levelId);
              if (!lvl && subCat.sentenceLevels) {
                lvl = subCat.sentenceLevels.find(l => l.id === levelId || l.slug === levelId);
              }
              if (lvl) {
                levelConfig = lvl;
                break;
              }
            }
            if (levelConfig) break;
          }
        }
      }

      // FALLBACK
      if (!levelConfig) {
        levelConfig = {
          "id": "en-tr_eng_genel-words-a1_vocabulary",
          "name": "Beginner / Başlangıç Kelimeleri",
          "path": "Turkish/content/en_tr/words_en_tr.json",
          "levelCode": "A1_Vocabulary"
        };
      }

      if (levelConfig) {
        // 2. Fetch JSON — Hosting önce, GCS yedek (403'e karşı)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        let data;
        try {
          data = await fetchLessonJson(levelConfig.path, controller.signal);
        } finally {
          clearTimeout(timeoutId);
        }

        if (data) {
          let rawWords = [];

          // 3. Unpack dataset format (flat list vs Chinese-style nested list)
          if (Array.isArray(data)) {
            if (data.length > 0 && data[0].words && Array.isArray(data[0].words)) {
              // Structured array of level objects (nested Chinese format)
              if (levelConfig.levelCode) {
                const targetLvl = data.find(item => item.level === levelConfig.levelCode || item.level_tag === levelConfig.levelCode);
                rawWords = targetLvl ? targetLvl.words : [];
              } else {
                rawWords = data.flatMap(item => item.words || []);
              }
            } else {
              rawWords = data;
            }
          } else if (data && data.words) {
            rawWords = data.words;
          } else if (data && data.phrase_vault) {
            rawWords = data.phrase_vault;
          } else if (data && data.vocabulary_vault) {
            rawWords = data.vocabulary_vault;
          } else {
            rawWords = Object.values(data);
          }

          // 4. If levelCode filter is specified, filter flat list entries
          if (levelConfig.levelCode && !(Array.isArray(data) && data.length > 0 && data[0].words && Array.isArray(data[0].words))) {
            const targetCode = levelConfig.levelCode.toLowerCase();
            rawWords = rawWords.filter(w => {
              const tags = [
                w.level,
                w.level_tag,
                w.category,
                ...(Array.isArray(w.tags) ? w.tags : (w.tags ? [w.tags] : []))
              ].filter(Boolean).map(t => String(t).toLowerCase());
              
              return tags.includes(targetCode);
            });
          }

          // 5. Sterilize level dataset
          const sterilizedRawWords = sanitizeWordData(rawWords);
          
          const basePath = levelConfig.path.split('/')[0];

          fetchedWords = sterilizedRawWords.map(w => {
            const english = w.english;
            const turkish = w.turkish;
            
            // Remove special characters, replace spaces with underscores, and trim trailing underscores
            const safeWord = (english || "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
            
            // Resolve audio URL if defined in metadata object (like Chinese/Arabic)
            let audioUrl = "";
            if (w.audioUrl) {
              audioUrl = w.audioUrl;
            } else if (w.audio_url) {
              audioUrl = w.audio_url;
            } else if (w.audio) {
              if (typeof w.audio === 'string') {
                audioUrl = w.audio;
              } else if (w.audio.default) {
                audioUrl = w.audio.default;
              } else if (w.audio.male) {
                audioUrl = w.audio.male;
              } else if (w.audio.female) {
                audioUrl = w.audio.female;
              }
            }

            if (!audioUrl) {
              const langMap = {
                'Spanish': 'es',
                'French': 'fr',
                'Almanca': 'de',
                'Italy': 'it',
                'Italyanca': 'it',
                'Russian': 'ru',
                'Portugal': 'pt',
                'Japan': 'ja',
                'Korean': 'ko',
                'Greek': 'el'
              };

              if (langMap[basePath]) {
                let langCode = langMap[basePath];
                const cleanWord = (english || "")
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "") // remove all accents
                  .replace(/[^a-z0-9_]+/g, '_')
                  .replace(/^_|_$/g, '');
                
                const isSentence = levelConfig.path.includes('sentences');
                let folder = isSentence ? `sentences_${langCode}` : `words_${langCode}`;
                
                // Special overrides for languages with custom casing or prefixes
                if (basePath === "Portugal") {
                  langCode = "brpt";
                  folder = isSentence ? "sentences_BrPt" : "words_BrPt";
                }
                
                audioUrl = `/data/${basePath}/audio/${folder}/${langCode}_${cleanWord}.mp3`;
              } else {
                let audioPrefix = "";
                if (basePath === "Tr_Eng_Temel_Cumleler") {
                  audioPrefix = "sentence_";
                }
                audioUrl = `/data/${basePath}/Audio/${audioPrefix}${w.id}_${safeWord}.mp3`;

                // Osmanlıca audio
                if (basePath === "Osm_Tr") {
                  const paddedId = String(w.id).padStart(3, '0');
                  const audioWord = (w.osmanlica_latin || english || '')
                    .toLowerCase()
                    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
                    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
                    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                  audioUrl = `/data/Osm_Tr/Audio/osm_${paddedId}_${audioWord}.mp3`;
                }
              }
            }

            // Adjust legacy URL prefixes
            if (audioUrl.startsWith('/data/data/')) {
              audioUrl = audioUrl.replace('/data/data/', '/data/');
            }
            if (audioUrl.includes('/audio_phrases/')) {
              audioUrl = audioUrl.replace('/audio_phrases/', '/audio/');
            }
            if (audioUrl.includes('/audio_vocabulary/')) {
              audioUrl = audioUrl.replace('/audio_vocabulary/', '/audio/');
            }

            // Prepend language basePath if not already present in the path and it's a relative path
            if (audioUrl && !audioUrl.startsWith('http') && basePath) {
              if (audioUrl.startsWith('/data/')) {
                // Keep fully-resolved absolute data URLs intact
              } else {
                let cleanAudio = audioUrl.startsWith('/') ? audioUrl.slice(1) : audioUrl;
                if (cleanAudio.startsWith('data/')) {
                  cleanAudio = cleanAudio.slice(5);
                }
                
                const lowerBase = basePath.toLowerCase();
                if (!cleanAudio.toLowerCase().startsWith(lowerBase + '/')) {
                  audioUrl = `${basePath}/${cleanAudio}`;
                }
              }
            }

            // Append GCS base URL if environment variables are set
            audioUrl = resolveDataUrl(audioUrl);

            return {
              ...w,
              english,
              turkish,
              romanized: w.romanized,
              romanized_script: w.romanized,
              audioUrl: audioUrl
            };
          }).filter(w => w.english && w.turkish);
        }
      }

      if (fetchedWords.length === 0) {
        throw new Error("Veritabanından kelime çekilemedi veya JSON boş.");
      }

      if (returnAll) {
        setWords(fetchedWords);
        setIsLoading(false);
        return;
      }

      // 6. Memolandum Pulse™ — her oturumda steril rastgele ~12 kelime
      // Kelimenin öğrenilip öğrenilmediğini kontrol eden yardımcı fonksiyon
      const isWordLearned = (word) => {
        if (!word) return false;
        const found = findVaultItem(vocabularyVault, word);
        if (!found?.item) return false;
        const entry = found.item;
        return entry.learningProgressPct === 100 || entry.firstTryCorrect === true || (Number(entry.reps) || 0) > 0;
      };

      // Seviye kelimelerini öğrenilmiş ve öğrenilmemiş olarak ikiye böl
      const levelUnlearned = fetchedWords.filter(w => !isWordLearned(w));
      const levelLearned = fetchedWords.filter(w => isWordLearned(w));

      // Bu dildeki tüm global öğrenilmiş kelimeleri kasadan çek (güvenli null/undefined filtrelemesi ile)
      const globalLearned = Object.values(vocabularyVault || {}).filter(entry => {
        if (!entry) return false;
        const isSameLang = entry.language === langId;
        const isLearned = entry.learningProgressPct === 100 || entry.firstTryCorrect === true || (Number(entry.reps) || 0) > 0;
        return isSameLang && isLearned;
      });

      let finalWords = [];

      // Havuzdan 1 adet öğrenilmiş (learned) kelime seç (varsa önce seviyedekiler, yoksa global kasadakiler)
      let chosenLearnedWord = null;
      if (levelLearned.length > 0) {
        chosenLearnedWord = levelLearned[Math.floor(Math.random() * levelLearned.length)];
      } else if (globalLearned.length > 0) {
        const randomOldEntry = globalLearned[Math.floor(Math.random() * globalLearned.length)];
        chosenLearnedWord = {
          id: randomOldEntry.id,
          english: randomOldEntry.english,
          turkish: randomOldEntry.turkish,
          romanized: randomOldEntry.romanized || "",
          romanized_script: randomOldEntry.romanized || "",
          audioUrl: randomOldEntry.audioUrl || "",
          isFromVault: true
        };
      }

      // Öğrenilmemiş kelimelerden hedef sayıyı belirle (1 learned varsa 11, yoksa 12)
      const targetUnlearnedCount = chosenLearnedWord ? 11 : 12;
      const adaptiveUnlearned = selectAdaptiveWords(levelUnlearned, vocabularyVault, {
        shuffle: true,
        targetCount: Math.min(targetUnlearnedCount, levelUnlearned.length),
        learnedWeightScale: 0.15,
        dueBias: 0.55,
      });

      if (chosenLearnedWord) {
        finalWords = [...adaptiveUnlearned, chosenLearnedWord];
      } else {
        finalWords = adaptiveUnlearned;
      }

      // Eğer seviyede yeterli kelime yoksa veya havuz küçükse, 12'ye ulaşmak için backfill (öğrenilmiş kelimelerle doldurma) yapalım
      const targetTotal = Math.min(12, fetchedWords.length);
      if (finalWords.length < targetTotal) {
        const remainingCount = targetTotal - finalWords.length;
        const availableLearned = [
          ...levelLearned.filter(w => !finalWords.some(fw => fw.english === w.english)),
          ...globalLearned
            .filter(w => w && !finalWords.some(fw => fw.english === w.english))
            .map(w => ({
              id: w.id,
              english: w.english,
              turkish: w.turkish,
              romanized: w.romanized || "",
              romanized_script: w.romanized || "",
              audioUrl: w.audioUrl || "",
              isFromVault: true
            }))
        ];

        // Rastgele karıştırıp gerekli adet kadarını alalım
        const shuffledLearned = availableLearned.sort(() => 0.5 - Math.random());
        const backfill = shuffledLearned.slice(0, remainingCount);
        finalWords = [...finalWords, ...backfill];
      }

      // Güvenlik Bariyeri: Eğer herhangi bir sebeple liste boş kalırsa veya kelime çekilemediyse, seviyenin ilk 12 kelimesini yükle
      if (finalWords.length === 0) {
        console.warn("[useLessonLoader] Kelime seçimi boş döndü, varsayılan seviye kelimeleri yükleniyor.");
        finalWords = fetchedWords.slice(0, 12);
      }

      // Tüm kelimeleri rastgele sırayla karıştırarak (shuffle) set et
      const shuffledFinalWords = finalWords.sort(() => 0.5 - Math.random());

      setWords(shuffledFinalWords);
    } catch (err) {
      console.error("Kelime yükleme hatası:", err);
      setError(err);
      setWords([{ english: 'error', turkish: 'hata' }]);
    } finally {
      setIsLoading(false);
    }
  }, [levelId, langId, uid, returnAll]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  return {
    words,
    isLoading,
    error,
    reload: loadWords
  };
}
