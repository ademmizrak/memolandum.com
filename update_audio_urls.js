const fs = require("fs");
const path = require("path");

const jsonFilePath =
  "D:\\000Memorade\\public\\data\\Chinesee\\content\\zh_ch_en\\words_ch_en.json";
const audioFolder = "D:\\000Memorade\\public\\data\\Chinesee\\audio\\words_ch";

function updateChineseLocalUrls() {
  try {
    const rawData = fs.readFileSync(jsonFilePath, "utf8");
    let jsonData = JSON.parse(rawData);
    const mp3Files = fs.readdirSync(audioFolder);

    // JSON yapınız "words" anahtarı altında bir dizi içeriyor
    jsonData = jsonData.map((group) => {
      if (group.words) {
        group.words = group.words.map((item) => {
          // ID (cn_101) ile MP3 dosyası (cn_101.mp3) eşleşmesi
          const id = item.word_id;
          const fileName = `${id}.mp3`;

          // Enterprise Yapı: Gelecekte male/female eklenebilecek bir nesne yapısı
          item.audio = {
            default: mp3Files.includes(fileName)
              ? `/audio/words_ch/${fileName}`
              : null,
          };

          // Eski harici linki kaldır
          delete item.audio_url;
          return item;
        });
      }
      return group;
    });

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");
    console.log("✅ Çince yerel ses yolları başarıyla güncellendi.");
  } catch (err) {
    console.error("❌ HATA:", err.message);
  }
}

updateChineseLocalUrls();
