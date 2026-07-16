const fs = require("fs");
const path = require("path");

// Güncellenecek dosyanın yolu
const inputFile = path.join(
  __dirname,
  "public/data/Almanca/content/de_en/de_en_words.json",
);
const outputFile = path.join(
  __dirname,
  "public/data/Almanca/content/de_en/de_en_words_updated.json",
);

const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// URL'leri güncelle
const updatedData = data.map((item) => {
  // Yeni standart yol: /audio/{lang_code}/{type}/{id}.mp3
  // Örnek: /audio/de/words/de_word_001.mp3
  const newPath = `/audio/${item.language_code}/words/${item.id}.mp3`;

  return {
    ...item,
    audioUrl: newPath,
  };
});

// Güncellenmiş dosyayı kaydet
fs.writeFileSync(outputFile, JSON.stringify(updatedData, null, 2));
console.log(
  `Başarılı! ${updatedData.length} kelimenin ses yolları güncellendi ve ${outputFile} dosyasına kaydedildi.`,
);
