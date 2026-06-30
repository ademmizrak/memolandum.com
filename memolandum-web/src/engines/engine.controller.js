import { gameManifest } from "../config/manifest";
import { HighwayGame } from "./highway.shell";
import { BreakoutGame } from "./breakout.shell";
import { InvadersGame } from "./invaders.shell";
import { ShooterGame } from "./shooter.shell";
import { WordAscentGame } from "./wordascent.shell";
import { WordDropGame } from "./worddrop.shell";

/**
 * React arayüzü ile Vanilla JS oyun motorları arasındaki köprü (Bridge).
 * React sadece bu sınıfı tanır, oyun motorunun iç detaylarını bilmez.
 */
export class EngineController {
  constructor(canvasElement, onScoreUpdate, onGameOver) {
    this.canvasElement = canvasElement;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.engineInstance = null;
    this.audioState = true;
  }

  /**
   * Oyunu başlatır.
   * @param {string} levelId - Seviye ID'si (ör: "a1", "b2")
   * @param {string} langId - Dil çifti ID'si (ör: "en-tr")
   * @param {string} gameId - Hangi oyun motorunun kullanılacağı (ör: "highway", "breakout")
   * @param {boolean} audioEnabled - Ses açık/kapalı durumu
   */
  async initGame(levelId, langId, gameId, audioEnabled, fxEnabled = true) {
    try {
      console.log(`[EngineController] Başlatılıyor: ${gameId} | ${langId} - ${levelId}`);
      this.audioState = audioEnabled;
      
      // Temizleme (TTS Cache temizliği)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // 1. Manifest üzerinden ilgili verileri bul
      let levelConfig = null;
      let mainCategoryId = null;

      for (const mainCat of gameManifest.mainCategories) {
        for (const subCat of mainCat.subCategories) {
          if (subCat.id === langId) {
            for (let i = 0; i < subCat.levels.length; i++) {
              if (subCat.levels[i].id === levelId) {
                levelConfig = subCat.levels[i];
                break;
              }
            }
            break;
          }
        }
        if (levelConfig) break;
      }

      // Fallback: If levelId wasn't found in the new language, default to its first level
      if (!levelConfig) {
        console.warn(`[EngineController] Seviye bulunamadı (${levelId}). '${langId}' için varsayılan ilk seviyeye düşülüyor...`);
        for (const mainCat of gameManifest.mainCategories) {
          for (const subCat of mainCat.subCategories) {
            if (subCat.id === langId && subCat.levels.length > 0) {
              levelConfig = subCat.levels[0];
              break;
            }
          }
          if (levelConfig) break;
        }
      }

      if (!levelConfig) {
        console.error(`[EngineController] ${langId} için hiçbir seviye bulunamadı!`);
        return false;
      }

      // 2. Statik verileri (JSON) çek
      const response = await fetch(`/data/${levelConfig.path}`);
      let wordsData = await response.json();

      // Diller Arası Ortak Mekanizma (Veri Normalizasyonu)
      // Vanilla JS oyun motorlarının tümü eski API sebebiyle 'english' ve 'turkish' özelliklerini arar.
      // Farklı dil paketlerinde (Almanca, Fransızca vb.) 'word' ve 'translation' özellikleri bulunduğu için,
      // React katmanında (burada) veriyi oyun motorlarına göndermeden önce ortak formata çeviriyoruz.
      wordsData = wordsData.map(item => ({
        ...item,
        english: item.english || item.word || item.original_script || "",
        turkish: item.turkish || item.translation || item.meaning || "",
        romanized: item.romanized_script || item.romanized || ""
      }));

      console.log(`[EngineController] Kelimeler yüklendi: ${wordsData.length} adet.`);
      
      // Ses Çalma Fonksiyonu (Motor tetiklediğinde çalışır)
      const playAudioCallback = (word) => {
        if (!this.audioState || typeof window === 'undefined') return;

        // 1. Check if the word object has an audioUrl (MP3)
        if (typeof word === 'object' && word.audioUrl) {
          try {
            const audio = new Audio(word.audioUrl);
            audio.play().catch(e => console.warn("Audio play blocked or failed:", e));
            return; // Exit after playing MP3
          } catch (e) {
            console.warn("Audio MP3 error:", e);
          }
        }

        // 2. TTS Fallback
        if (window.speechSynthesis) {
          try {
            const textToSpeak = typeof word === 'string' ? word : (word.english || word.word || "");
            if (!textToSpeak) return;
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            // Dil tespiti (basit yaklaşım)
            let langCode = 'en-US';
            if (langId.includes('almanca')) langCode = 'de-DE';
            else if (langId.includes('fr')) langCode = 'fr-FR';
            else if (langId.includes('sp')) langCode = 'es-ES';
            else if (langId.includes('it')) langCode = 'it-IT';
            else if (langId.includes('ru')) langCode = 'ru-RU';

            utterance.lang = langCode;
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.warn("TTS hatası:", e);
          }
        }
      };

      // 3. Oyun motorunu (Vanilla JS) yükle ve başlat
      switch(gameId) {
        case 'breakout':
          this.engineInstance = new BreakoutGame(wordsData, levelConfig.path, this.canvasElement, playAudioCallback);
          break;
        case 'invaders':
          this.engineInstance = new InvadersGame(wordsData, levelConfig.path, this.canvasElement, playAudioCallback);
          break;
        case 'shooter':
          this.engineInstance = new ShooterGame(wordsData, levelConfig.path, this.canvasElement, playAudioCallback);
          break;
        case 'wordascent':
          this.engineInstance = new WordAscentGame(wordsData, levelConfig.path, this.canvasElement, playAudioCallback);
          break;
        case 'worddrop':
          this.engineInstance = new WordDropGame(wordsData, levelConfig.path, this.canvasElement, playAudioCallback);
          break;
        case 'highway':
        default:
          this.engineInstance = new HighwayGame(wordsData, levelConfig.path, this.canvasElement, playAudioCallback);
          break;
      }
      
      // Mute FX durumunu ilk başta ayarla
      this.updateFxState(fxEnabled);

      // HighwayGame'i başlat
      if (typeof this.engineInstance.startGame === 'function') {
        this.engineInstance.startGame();
      } else if (typeof this.engineInstance.init === 'function') {
        this.engineInstance.init();
      } else if (typeof this.engineInstance.start === 'function') {
        this.engineInstance.start();
      }

      return true;

    } catch (error) {
      console.error("[EngineController] Veri yükleme hatası:", error);
      return false;
    }
  }

  updateAudioState(isEnabled) {
    this.audioState = isEnabled;
    console.log(`[EngineController] Ses durumu güncellendi: ${isEnabled}`);
  }

  updateFxState(isEnabled) {
    if (this.engineInstance && this.engineInstance.soundManager) {
      this.engineInstance.soundManager.setMuted(!isEnabled);
    }
  }

  destroy() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (this.engineInstance) {
      if (typeof this.engineInstance.stop === "function") {
        this.engineInstance.stop();
      }
      if (typeof this.engineInstance.destroy === "function") {
        this.engineInstance.destroy();
      }
    }
    this.engineInstance = null;
  }
}
