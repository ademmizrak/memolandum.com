const fs = require("fs");
const path = require("path");

const contentBasePath = "D:\\000Memorade\\public\\data\\Russian\\content";
const audioBasePath = "D:\\000Memorade\\public\\data\\Russian\\audio";

const targets = [
  {
    dir: "ru_en",
    file: "words_ru_en.json",
    audioSub: "words_ru",
    type: "word",
  },
  {
    dir: "ru_tr",
    file: "words_ru_tr.json",
    audioSub: "words_ru",
    type: "word",
  },
  {
    dir: "ru_en",
    file: "sentences_ru_en.json",
    audioSub: "sentences_ru",
    type: "sentence",
  },
  {
    dir: "ru_tr",
    file: "sentences_ru_tr.json",
    audioSub: "sentences_ru",
    type: "sentence",
  },
  {
    dir: "ru_en",
    file: "alphabet_ru_en.json",
    audioSub: "alphabet_ru",
    type: "alpha",
  },
  {
    dir: "ru_tr",
    file: "alphabet_ru_tr.json",
    audioSub: "alphabet_ru",
    type: "alpha",
  },
];

function updateRussianAudioStandardized() {
  targets.forEach((target) => {
    const jsonFilePath = path.join(contentBasePath, target.dir, target.file);
    const audioDir = path.join(audioBasePath, target.audioSub);

    if (!fs.existsSync(jsonFilePath) || !fs.existsSync(audioDir)) return;

    console.log(`🚀 İşleniyor: ${target.file}`);
    let jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
    const mp3Files = fs.readdirSync(audioDir);

    jsonData = jsonData.map((item) => {
      const idParts = item.id.split("_");
      const num = idParts[idParts.length - 1]; // Örn: 001
      let fileName;

      // İsimlendirme desenlerine göre dosya eşleştirme
      if (target.type === "word") {
        fileName = mp3Files.find((f) => f.startsWith(`rus_a1_${num}`));
      } else if (target.type === "sentence") {
        fileName = mp3Files.find((f) => f.startsWith(`ru_biz_${num}`));
      } else if (target.type === "alpha") {
        fileName = mp3Files.find((f) => f.startsWith(`rus_lvl0_${num}`));
      }

      // Enterprise Standart: Audio nesnesini ekle
      item.audio = {
        default: fileName ? `/audio/${target.audioSub}/${fileName}` : null,
      };

      // Eski URL yapılarını temizle
      if (item.audioUrl) delete item.audioUrl;
      if (item.audio_url) delete item.audio_url;
      return item;
    });

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");
    console.log(`✅ ${target.file} başarıyla güncellendi.`);
  });
}

updateRussianAudioStandardized();
