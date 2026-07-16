import { useState, useEffect, useCallback } from 'react';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { gameManifest } from '../config/manifest';

let DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_BASE_URL || "";
if (typeof window !== "undefined" && !DATA_BASE_URL) {
  const hostname = window.location.hostname;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    DATA_BASE_URL = "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data";
  }
}

/**
 * Resolves a local data/audio path to a public Google Cloud Storage bucket URL if configured.
 * e.g., "/audio/de/words/a1_de_tr_01_zeit.mp3" -> "https://storage.googleapis.com/.../data/audio/de/words/a1_de_tr_01_zeit.mp3"
 */
export function resolveDataUrl(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  
  // If cleanPath starts with 'data/', strip it to avoid duplication if DATA_BASE_URL already contains /data
  const pathPrefix = cleanPath.startsWith("data/") ? cleanPath.slice(5) : cleanPath;

  if (DATA_BASE_URL) {
    const base = DATA_BASE_URL.endsWith("/") ? DATA_BASE_URL : DATA_BASE_URL + "/";
    return `${base}${pathPrefix}`;
  }
  return `/data/${pathPrefix}`;
}

/**
 * useLessonLoader hook brings the word set required for the active game level.
 * It supports loading from GCS bucket URLs or falling back to local files.
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
      let fetchedWords = [];
      let levelConfig = null;

      // 1. Locate level in the manifest
      for (const mainCat of gameManifest.mainCategories) {
        for (const subCat of mainCat.subCategories) {
          if (subCat.id === langId) {
            let lvl = subCat.levels?.find(l => l.id === levelId);
            if (!lvl && subCat.sentenceLevels) {
              lvl = subCat.sentenceLevels.find(l => l.id === levelId);
            }
            if (lvl) {
              levelConfig = lvl;
              break;
            }
          }
        }
        if (levelConfig) break;
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
        // 2. Fetch JSON (from GCS bucket or local public depending on environment config)
        const fetchUrl = resolveDataUrl(levelConfig.path);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
        
        const response = await fetch(fetchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
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
          
          const basePath = levelConfig.path.split('/')[0];
          const subPath = levelConfig.path.split('/').length > 1 ? levelConfig.path.split('/')[1] : '';

          fetchedWords = rawWords.map(w => {
            const english = w.english || w.original_script || w.word || w.mission_word || w.mission_phrase || w.en || w.osmanlica_latin || w.hanzi || w.kanji || w.character || w.character_script || w.root;
            const turkish = w.turkish || w.meaning || w.translation || w.target_translation || w.tr || w.guncel_turkce || 
                            w.es || w.fr || w.de || w.ar || w.pt || w.brpt || w.zh || w.cn || w.it || w.ru || w.ja || w.jap || w.ko || w.el || w.type;
            
            // Remove special characters, replace spaces with underscores, and trim trailing underscores
            const safeWord = (english || "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
            
            // Resolve audio URL if defined in metadata object (like Chinese/Arabic)
            let audioUrl = "";
            if (w.audioUrl) {
              audioUrl = w.audioUrl;
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

            const romanized = w.osmanlica_arapca || w.romanized_script || w.romanized || w.latin_okunusu || w.pinyin || '';

            return {
              ...w,
              english,
              turkish,
              romanized,
              romanized_script: romanized, // RetroShooter compatibility
              audioUrl: audioUrl
            };
          }).filter(w => w.english && w.turkish);
        }
      }

      if (fetchedWords.length === 0) {
        throw new Error("Veritabanından kelime çekilemedi veya JSON boş.");
      }
      
      setWords(fetchedWords);
    } catch (err) {
      console.error("Kelime yükleme hatası:", err);
      setError(err);
      setWords([{ english: 'error', turkish: 'hata' }]);
    } finally {
      setIsLoading(false);
    }
  }, [levelId, langId, uid]);

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
